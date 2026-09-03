package com.finalYear.smartClassRoom.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FaceRegisterRequest {
    private Long studentId;
    private Long teacherId;
}
