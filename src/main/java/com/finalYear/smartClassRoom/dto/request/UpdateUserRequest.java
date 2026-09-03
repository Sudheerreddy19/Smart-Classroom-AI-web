package com.finalYear.smartClassRoom.dto.request;

import com.finalYear.smartClassRoom.entity.User;
import lombok.*;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {

    private String firstName;

    private String lastName;

    private String email;

    private String phone;

    private String password;

    private User.Role role;

    private Boolean enabled;

}