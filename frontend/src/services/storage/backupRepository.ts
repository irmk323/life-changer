import type {AppState} from '../../types/appState';
import {normalise} from './localStorageRepository';

const DB_NAME='lifeChangerBackups';
const STORE='handles';
const HANDLE_KEY='backupFolder';
const LAST_BACKUP_KEY='lifeChanger.lastBackupAt';
const ROTATION_KEY='lifeChanger.backupRotation';
const ROTATION_SIZE=3;
const AUTO_BACKUP_INTERVAL_MS=24*60*60*1000;

export const supportsFileSystemAccess=(): boolean=>typeof window!=='undefined'&&'showDirectoryPicker' in window;

const openDb=(): Promise<IDBDatabase>=>new Promise((resolve,reject)=>{
  const req=indexedDB.open(DB_NAME,1);
  req.onupgradeneeded=()=>req.result.createObjectStore(STORE);
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
});

async function idbGet<T>(key: string): Promise<T|undefined> {
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const req=db.transaction(STORE,'readonly').objectStore(STORE).get(key);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db=await openDb();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).put(value,key);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
}

export const getBackupFolderName=async (): Promise<string|null>=>{
  const handle=await idbGet<any>(HANDLE_KEY);
  return handle?handle.name:null;
};

const queryFolderPermission=async (handle: any, request: boolean): Promise<boolean>=>{
  const opts={mode:'readwrite'};
  const state=await handle.queryPermission(opts);
  if(state==='granted')return true;
  if(request)return (await handle.requestPermission(opts))==='granted';
  return false;
};

export const chooseBackupFolder=async (): Promise<string|null>=>{
  if(!supportsFileSystemAccess())return null;
  const handle=await (window as any).showDirectoryPicker({id:'lifeChangerBackups',mode:'readwrite'});
  await idbSet(HANDLE_KEY,handle);
  return handle.name as string;
};

const nextRotationFileName=(): string=>{
  const current=Number(localStorage.getItem(ROTATION_KEY)||'0');
  const next=(current%ROTATION_SIZE)+1;
  localStorage.setItem(ROTATION_KEY,String(next));
  return `backup-${next}.json`;
};

export type BackupResult='wrote'|'no-folder'|'no-permission'|'unsupported';

export const backupToFolder=async (state: AppState, requestPermission: boolean): Promise<BackupResult>=>{
  if(!supportsFileSystemAccess())return 'unsupported';
  const handle=await idbGet<any>(HANDLE_KEY);
  if(!handle)return 'no-folder';
  if(!(await queryFolderPermission(handle,requestPermission)))return 'no-permission';
  const fileHandle=await handle.getFileHandle(nextRotationFileName(),{create:true});
  const writable=await fileHandle.createWritable();
  await writable.write(JSON.stringify(state,null,2));
  await writable.close();
  localStorage.setItem(LAST_BACKUP_KEY,String(Date.now()));
  return 'wrote';
};

export const maybeAutoBackup=async (state: AppState): Promise<void>=>{
  try{
    const last=Number(localStorage.getItem(LAST_BACKUP_KEY)||'0');
    if(Date.now()-last<AUTO_BACKUP_INTERVAL_MS)return;
    await backupToFolder(state,false);
  }catch{
    // best-effort only; failures are silent and covered by manual backup/export
  }
};

export const lastBackupAt=(): Date|null=>{
  const raw=localStorage.getItem(LAST_BACKUP_KEY);
  return raw?new Date(Number(raw)):null;
};

export const downloadBackup=(state: AppState): void=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`life-changer-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importBackup=async (file: File): Promise<AppState>=>normalise(JSON.parse(await file.text()));
