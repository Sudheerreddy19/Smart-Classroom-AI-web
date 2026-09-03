package com.finalYear.smartClassRoom.util;

import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;

public class ImageUtil {

    private ImageUtil() {
    }

    public static boolean isImage(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return false;
        }

        String contentType = file.getContentType();

        return contentType != null &&
                (contentType.equals("image/jpeg")
                        || contentType.equals("image/png")
                        || contentType.equals("image/jpg"));
    }

    public static BufferedImage readImage(MultipartFile file)
            throws IOException {

        return ImageIO.read(file.getInputStream());
    }

    public static int getWidth(MultipartFile file)
            throws IOException {

        return readImage(file).getWidth();
    }

    public static int getHeight(MultipartFile file)
            throws IOException {

        return readImage(file).getHeight();
    }

    public static String getExtension(String filename) {

        if (filename == null || !filename.contains(".")) {
            return "";
        }

        return filename.substring(filename.lastIndexOf('.') + 1);
    }
}