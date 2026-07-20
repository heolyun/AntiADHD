package com.antiadhd.common.exception;

import org.springframework.http.HttpStatus;

public class TooManyRequestsException extends AppException {
    public TooManyRequestsException(String message) {
        super(HttpStatus.TOO_MANY_REQUESTS, "Too Many Requests", message);
    }
}
