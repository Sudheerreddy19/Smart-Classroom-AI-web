package com.finalYear.smartClassRoom.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

public class DateTimeUtil {

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss", Locale.ROOT);

    private DateTimeUtil() {}

    public static String format(LocalDateTime dateTime) {

        if (dateTime == null)
            return "";

        return dateTime.format(FORMATTER);
    }
}