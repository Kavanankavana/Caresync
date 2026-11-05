package com.caresync.model;

import jakarta.persistence.*;

/**
 * ClinicSetting Entity mapped to 'clinic_settings' table in MySQL via Hibernate ORM.
 */
@Entity
@Table(name = "clinic_settings")
public class ClinicSetting {

    @Id
    @Column(name = "setting_key", nullable = false, length = 50)
    private String settingKey;

    @Column(name = "setting_value", nullable = false, length = 255)
    private String settingValue;

    public ClinicSetting() {}

    public ClinicSetting(String settingKey, String settingValue) {
        this.settingKey = settingKey;
        this.settingValue = settingValue;
    }

    public String getSettingKey() {
        return settingKey;
    }

    public void setSettingKey(String settingKey) {
        this.settingKey = settingKey;
    }

    public String getSettingValue() {
        return settingValue;
    }

    public void setSettingValue(String settingValue) {
        this.settingValue = settingValue;
    }
}
