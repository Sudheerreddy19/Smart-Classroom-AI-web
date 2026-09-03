package com.finalYear.smartClassRoom.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "ai_queries",
        indexes = {
                @Index(name = "idx_ai_query_session", columnList = "session_id"),
                @Index(name = "idx_ai_query_created", columnList = "created_at"),
                @Index(name = "idx_ai_query_type", columnList = "query_type")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AIQuery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private AISession session;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String prompt;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String response;

    @Enumerated(EnumType.STRING)
    @Column(name = "query_type", nullable = false, length = 30)
    @Builder.Default
    private QueryType queryType = QueryType.GENERAL;

    @Column(name = "tokens_used")
    private Integer tokensUsed;

    @Column(name = "subject_context", length = 100)
    private String subjectContext;

    @Column(name = "response_time_ms")
    private Long responseTimeMs;

    @Column(name = "model_name", length = 50)
    private String modelName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum QueryType {
        GENERAL,
        QUESTION_ANSWER,
        QUIZ,
        NOTES,
        ASSIGNMENT,
        LECTURE_SUMMARY
    }
}