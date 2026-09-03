package com.finalYear.smartClassRoom.dto.request;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpenAiRequest {

    private double temperature;
    private double humidity;
    private int light;
    private int airQuality;
    private boolean motion;
}