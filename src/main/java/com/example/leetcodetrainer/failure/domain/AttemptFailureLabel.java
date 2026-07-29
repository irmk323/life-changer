package com.example.leetcodetrainer.failure.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "attempt_failure_labels", uniqueConstraints = @UniqueConstraint(columnNames = {"attempt_id", "failure_label_id"}))
public class AttemptFailureLabel {
    @Id private UUID id;
    @Column(name = "attempt_id", nullable = false) private UUID attemptId;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "failure_label_id", nullable = false) private FailureLabel failureLabel;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private FailureSeverity severity;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private FailureLabelSource source;
    @Column(nullable = false) private boolean confirmed;
    @Lob private String notes;
    @Column(nullable = false) private Instant createdAt;
    @Column(nullable = false) private Instant updatedAt;
    protected AttemptFailureLabel() { }
    public AttemptFailureLabel(UUID id, UUID attemptId, FailureLabel label, FailureSeverity severity, FailureLabelSource source, boolean confirmed, String notes, Instant now) {
        this.id=id; this.attemptId=attemptId; this.failureLabel=label; this.severity=severity; this.source=source; this.confirmed=confirmed; this.notes=notes; this.createdAt=now; this.updatedAt=now;
    }
    public void confirm(String notes, Instant now) { source=FailureLabelSource.SYSTEM_CONFIRMED; confirmed=true; this.notes=notes; updatedAt=now; }
    public void updateUserSelection(FailureSeverity severity, String notes, Instant now) { this.severity=severity; source=FailureLabelSource.USER_SELECTED; confirmed=true; this.notes=notes; updatedAt=now; }
    public UUID getId(){return id;} public UUID getAttemptId(){return attemptId;} public FailureLabel getFailureLabel(){return failureLabel;} public FailureSeverity getSeverity(){return severity;} public FailureLabelSource getSource(){return source;} public boolean isConfirmed(){return confirmed;} public String getNotes(){return notes;}
}
