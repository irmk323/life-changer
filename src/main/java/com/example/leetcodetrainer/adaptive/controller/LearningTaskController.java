package com.example.leetcodetrainer.adaptive.controller;

import com.example.leetcodetrainer.adaptive.domain.StageApplicability;
import com.example.leetcodetrainer.adaptive.repository.LearningTaskTemplateRepository;
import com.example.leetcodetrainer.adaptive.service.AdaptiveLearningService;
import com.example.leetcodetrainer.adaptive.service.ReasoningProfileService;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
public class LearningTaskController {
 private final LearningTaskTemplateRepository tasks; private final ReasoningProfileService profiles; private final AdaptiveLearningService learning;
 public LearningTaskController(LearningTaskTemplateRepository tasks, ReasoningProfileService profiles, AdaptiveLearningService learning){this.tasks=tasks;this.profiles=profiles;this.learning=learning;}
 @GetMapping("/learning-tasks") public String list(Model model){model.addAttribute("tasks",tasks.findByActiveTrueOrderByCodeAsc());return "learning-tasks/library";}
 @GetMapping("/learning-tasks/{code}") public String detail(@PathVariable String code,Model model){var task=tasks.findByCodeAndActiveTrue(code).orElseThrow();model.addAttribute("task",task);model.addAttribute("stages",profiles.stagesFor(task.getProfile()));return "learning-tasks/detail";}
 @PostMapping("/learning-tasks/{code}/start") public String start(@PathVariable String code,@RequestParam(required=false) UUID sourceAttemptId){return "redirect:/learning-task-attempts/"+learning.start(code,sourceAttemptId).getId()+"/workspace";}
 @GetMapping("/learning-task-attempts/{id}/workspace") public String workspace(@PathVariable UUID id,Model model){var attempt=learning.taskAttempt(id);var task=tasks.findById(attempt.getTaskTemplateId()).orElseThrow();var steps=profiles.stagesFor(task.getProfile());model.addAttribute("task",task);model.addAttribute("taskAttempt",attempt);model.addAttribute("requiredSteps",steps.stream().filter(s->s.applicability()==StageApplicability.REQUIRED).toList());model.addAttribute("optionalSteps",steps.stream().filter(s->s.applicability()==StageApplicability.OPTIONAL).toList());return "learning-tasks/workspace";}
 @PostMapping("/learning-task-attempts/{id}/contract") public String saveContract(@PathVariable UUID id,@RequestParam(required=false) String functionContract,@RequestParam(required=false) String baseCase,@RequestParam(required=false) String subproblems,@RequestParam(required=false) String compositionRule){learning.taskAttempt(id).saveContract(functionContract,baseCase,subproblems,compositionRule,Instant.now());return "redirect:/learning-task-attempts/"+id+"/workspace";}
 @PostMapping("/learning-task-attempts/{id}/complete") public String complete(@PathVariable UUID id){learning.taskAttempt(id).complete(Instant.now());return "redirect:/learning-task-attempts/"+id+"/workspace";}
}
