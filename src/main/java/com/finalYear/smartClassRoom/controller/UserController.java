package com.finalYear.smartClassRoom.controller;

import com.finalYear.smartClassRoom.dto.request.CreateUserRequest;
import com.finalYear.smartClassRoom.dto.request.UpdateUserRequest;
import com.finalYear.smartClassRoom.dto.response.UserResponse;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    // =====================================================
    // CREATE USER
    // =====================================================

    @PostMapping
    public UserResponse createUser(
            @RequestBody CreateUserRequest request,
            @AuthenticationPrincipal User loggedInUser) {

        return userService.createUser(request, loggedInUser);
    }

    // =====================================================
    // UPDATE USER
    // =====================================================

    @PutMapping("/{id}")
    public UserResponse updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal User loggedInUser) {

        return userService.updateUser(id, request, loggedInUser);
    }

    // =====================================================
    // DELETE USER
    // =====================================================

    @DeleteMapping("/{id}")
    public void deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User loggedInUser) {

        userService.deleteUser(id, loggedInUser);
    }

    // =====================================================
    // GET USER BY ID
    // =====================================================

    @GetMapping("/{id}")
    public UserResponse getUserById(@PathVariable Long id) {

        return userService.getUserById(id);
    }

    // =====================================================
    // GET ALL USERS
    // (Only returns users current user can see)
    // =====================================================

    @GetMapping
    public Page<UserResponse> getUsers(
            Pageable pageable,
            @AuthenticationPrincipal User loggedInUser) {

        return userService.getUsers(loggedInUser, pageable);
    }

    // =====================================================
    // GET USERS BY ROLE
    // =====================================================

    @GetMapping("/role/{role}")
    public Page<UserResponse> getUsersByRole(
            @PathVariable User.Role role,
            Pageable pageable,
            @AuthenticationPrincipal User loggedInUser) {

        return userService.getUsersByRole(role, loggedInUser, pageable);
    }

    // =====================================================
    // ENABLE USER
    // =====================================================

    @PutMapping("/{id}/enable")
    public void enableUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User loggedInUser) {

        userService.enableUser(id, loggedInUser);
    }

    // =====================================================
    // DISABLE USER
    // =====================================================

    @PutMapping("/{id}/disable")
    public void disableUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User loggedInUser) {

        userService.disableUser(id, loggedInUser);
    }

    // =====================================================
    // CHANGE PASSWORD
    // =====================================================

    @PutMapping("/{id}/password")
    public void changePassword(
            @PathVariable Long id,
            @RequestParam String password,
            @AuthenticationPrincipal User loggedInUser) {

        userService.changePassword(id, password, loggedInUser);
    }
}