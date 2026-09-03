package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.CreateUserRequest;
import com.finalYear.smartClassRoom.dto.request.UpdateUserRequest;
import com.finalYear.smartClassRoom.dto.response.UserResponse;
import com.finalYear.smartClassRoom.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {



        UserResponse createUser(CreateUserRequest request,
                                User loggedInUser);

        UserResponse updateUser(Long id,
                                UpdateUserRequest request,
                                User loggedInUser);

        void deleteUser(Long id,
                        User loggedInUser);

        UserResponse getUserById(Long id);

        Page<UserResponse> getAllUsers(Pageable pageable);

        Page<UserResponse> getUsersByRole(User.Role role,
                                          User loggedInUser, Pageable pageable);

        void changePassword(Long id,
                            String password,
                            User loggedInUser);

        void enableUser(Long id,
                        User loggedInUser);

        void disableUser(Long id,
                         User loggedInUser);

    UserResponse getUser(Long id);

    Page<UserResponse> getUsers(User loggedInUser,
                                Pageable pageable);
    }
