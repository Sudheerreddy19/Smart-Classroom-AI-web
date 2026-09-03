package com.finalYear.smartClassRoom.service.impl;


import com.finalYear.smartClassRoom.dto.request.CreateUserRequest;
import com.finalYear.smartClassRoom.dto.request.UpdateUserRequest;
import com.finalYear.smartClassRoom.dto.response.UserResponse;
import com.finalYear.smartClassRoom.entity.User;
import com.finalYear.smartClassRoom.exception.AccessDeniedException;
import com.finalYear.smartClassRoom.exception.DuplicateResourceException;
import com.finalYear.smartClassRoom.exception.ResourceNotFoundException;
import com.finalYear.smartClassRoom.repository.UserRepository;
import com.finalYear.smartClassRoom.security.RoleValidator;
import com.finalYear.smartClassRoom.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final RoleValidator roleValidator;

    private UserResponse map(User user) {

        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .accountLocked(user.isAccountLocked())
                .emailVerified(user.isEmailVerified())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .createdBy(
                        user.getCreatedBy() == null
                                ? null
                                : user.getCreatedBy().getId()
                )
                .build();
    }
    @Override
    public UserResponse createUser(CreateUserRequest request,
                                   User loggedInUser) {

        if (!roleValidator.canCreate(loggedInUser.getRole(),
                request.getRole())) {

            throw new AccessDeniedException("You don't have permission to create "
                    + request.getRole());
        }

        if (userRepository.existsByEmail(request.getEmail())) {

            throw new DuplicateResourceException("Email already exists.");
        }

        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .enabled(true)
                .emailVerified(false)
                .accountLocked(false)
                .createdBy(loggedInUser)
                .build();

        userRepository.save(user);

        return map(user);
    }
    @Override
    public UserResponse updateUser(Long id,
                                   UpdateUserRequest request,
                                   User loggedInUser) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", id));
        if (loggedInUser.getId().equals(id)
                && request.getRole() != user.getRole()) {

            throw new RuntimeException(
                    "You cannot change your own role.");
        }
        // Check permission
        if (!roleValidator.canManage(loggedInUser.getRole(), user.getRole())) {
            throw new RuntimeException(
                    "You don't have permission to update this user.");
        }

        // Check role change
        if (request.getRole() != null &&
                request.getRole() != user.getRole()) {

            if (!roleValidator.canCreate(
                    loggedInUser.getRole(),
                    request.getRole())) {

                throw new RuntimeException(
                        "You don't have permission to assign role "
                                + request.getRole());
            }

            user.setRole(request.getRole());
        }

        if (request.getFirstName() != null)
            user.setFirstName(request.getFirstName());

        if (request.getLastName() != null)
            user.setLastName(request.getLastName());

        if (request.getPhone() != null)
            user.setPhone(request.getPhone());

        if (request.getEmail() != null &&
                !request.getEmail().equals(user.getEmail())) {

            if (userRepository.existsByEmail(request.getEmail())) {
                throw new RuntimeException("Email already exists.");
            }

            user.setEmail(request.getEmail());
        }

        if (request.getPassword() != null &&
                !request.getPassword().isBlank()) {

            user.setPassword(
                    passwordEncoder.encode(request.getPassword()));
        }

        userRepository.save(user);

        return map(user);
    }
    @Override
    public void deleteUser(Long id, User loggedInUser) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", id));

        if (!roleValidator.canManage(loggedInUser.getRole(), user.getRole())) {
            throw new RuntimeException(
                    "You don't have permission to delete this user.");
        }if (loggedInUser.getId().equals(id)) {
            throw new RuntimeException("You cannot delete your own account.");
        }

        userRepository.delete(user);
    }
    @Override
    public UserResponse getUserById(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", id));

        return map(user);
    }
    @Override
    public Page<UserResponse> getAllUsers(Pageable pageable) {

        return userRepository.findAll(pageable)
                .map(this::map);
    }
    @Override
    public Page<UserResponse> getUsersByRole(User.Role role,
                                             User loggedInUser, Pageable pageable) {

        return userRepository
                .findByRole(role, pageable)
                .map(this::map);
    }
    @Override
    public void changePassword(Long id,
                               String password,
                               User loggedInUser) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", id));

        if (!roleValidator.canManage(loggedInUser.getRole(), user.getRole())) {
            throw new RuntimeException(
                    "You don't have permission.");
        }

        user.setPassword(
                passwordEncoder.encode(password));

        userRepository.save(user);
    }
    @Override
    public void enableUser(Long id,
                           User loggedInUser) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", id));

        if (!roleValidator.canManage(loggedInUser.getRole(), user.getRole())) {
            throw new RuntimeException(
                    "You don't have permission.");
        }

        user.setEnabled(true);

        userRepository.save(user);
    }
    @Override
    public void disableUser(Long id,
                            User loggedInUser) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", id));
        if (loggedInUser.getId().equals(id)) {
            throw new RuntimeException("You cannot disable your own account.");
        }
        if (!roleValidator.canManage(loggedInUser.getRole(), user.getRole())) {
            throw new RuntimeException(
                    "You don't have permission.");
        }

        user.setEnabled(false);

        userRepository.save(user);
    }
    @Override
    public UserResponse getUser(Long id) {

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User", id));

        return map(user);
    }
    @Override
    public Page<UserResponse> getUsers(User loggedInUser,
                                       Pageable pageable) {

        Page<User> users;

        switch (loggedInUser.getRole()) {

            case SUPER_ADMIN ->

                    users = userRepository.findAll(pageable);

            case ADMIN ->

                    users = userRepository.findByRoleIn(
                            java.util.Set.of(
                                    User.Role.HOD,
                                    User.Role.TEACHER,
                                    User.Role.STUDENT
                            ),
                            pageable
                    );

            case HOD ->

                    users = userRepository.findByRoleIn(
                            java.util.Set.of(
                                    User.Role.TEACHER,
                                    User.Role.STUDENT
                            ),
                            pageable
                    );

            case TEACHER ->

                    users = userRepository.findByRoleIn(
                            java.util.Set.of(
                                    User.Role.STUDENT
                            ),
                            pageable
                    );

            default ->

                    throw new RuntimeException("Access denied.");
        }

        return users.map(this::map);
    }
}