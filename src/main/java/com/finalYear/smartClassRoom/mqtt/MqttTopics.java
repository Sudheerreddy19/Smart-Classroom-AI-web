package com.finalYear.smartClassRoom.mqtt;

public final class MqttTopics {

    private MqttTopics() {}

    public static final String ATTENDANCE = "classroom/attendance";

    public static final String ENVIRONMENT = "classroom/environment";

    public static final String LIGHTS = "classroom/lights";

    public static final String FANS = "classroom/fans";

    public static final String PROJECTOR = "classroom/projector";

    public static final String DEVICE_STATUS = "classroom/device-status";

    public static final String ALERTS = "classroom/alerts";
}