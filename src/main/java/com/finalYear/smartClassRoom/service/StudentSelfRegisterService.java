package com.finalYear.smartClassRoom.service;

import com.finalYear.smartClassRoom.dto.request.StudentSelfRegisterRequest;
import com.finalYear.smartClassRoom.dto.response.AuthResponse;

import java.util.Map;

public interface StudentSelfRegisterService {

    /**
     * Step 1: Verify roll number + date-of-birth match.
     * Returns a preview of the student's academic details (name, dept, semester).
     * Does NOT create an account.
     */
    Map<String, Object> verifyIdentity(String rollNumber, String dateOfBirth);

    /**
     * Step 2: Create user account for a verified student.
     * Links the new User to the existing Student record and
     * sets registrationStatus = ACCOUNT_CREATED.
     */
    AuthResponse selfRegister(StudentSelfRegisterRequest request);
}
