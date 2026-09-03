package com.finalYear.smartClassRoom.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiDecisionResponse {

    private String fan;

    private String light;

    private String projector;

    private String alert;

    private String reason;
}