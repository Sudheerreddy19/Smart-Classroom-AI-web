package com.finalYear.smartClassRoom.dto.request;

import com.finalYear.smartClassRoom.entity.User;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRequest {

    private String firstName;

    private String lastName;

    private String email;

    private String password;

    private String phone;

    private User.Role role;
}