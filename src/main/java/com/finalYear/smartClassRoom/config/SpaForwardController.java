package com.finalYear.smartClassRoom.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaForwardController {

    /**
     * Forwards client-side React routes (e.g. /login, /dashboard, /bus-tracking)
     * to /index.html so React Router can handle routing on page refresh.
     * Excludes /api, /ws, /swagger-ui, /v3, /actuator, and static files with extensions.
     */
    @GetMapping(value = {
            "/{path:^(?!api|ws|swagger-ui|v3|actuator).*$}",
            "/{path:^(?!api|ws|swagger-ui|v3|actuator).*$}/**/{subpath:[^\\.]*}"
    })
    public String forward() {
        return "forward:/index.html";
    }
}