// 알림 설정의 모양과 기본값, 화면 표시용 이름. 서버와 화면이 함께 쓴다.

export type WriteFrequency = "off" | "daily" | "weekly";

export type NotificationSettings = {
  pastEnabled: boolean;
  pastHour: number; // 0~23, 한국 시간
  writeFrequency: WriteFrequency;
  writeWeekday: number; // 0 = 일요일
  writeHour: number;
};

// 설정을 한 번도 안 바꾼 계정의 값 (DB 함수 push_targets의 기본값과 같아야 한다)
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  pastEnabled: true,
  pastHour: 9,
  writeFrequency: "off",
  writeWeekday: 0,
  writeHour: 21,
};

export const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

// 0 → 오전 12시, 9 → 오전 9시, 13 → 오후 1시
export function hourLabel(h: number) {
  return `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}시`;
}

// DB 행 → 화면 값 (행이 없으면 기본값)
export function toNotificationSettings(
  row: { past_enabled: boolean; past_hour: number; write_frequency: WriteFrequency; write_weekday: number; write_hour: number } | null,
): NotificationSettings {
  if (!row) return DEFAULT_NOTIFICATION_SETTINGS;
  return {
    pastEnabled: row.past_enabled,
    pastHour: row.past_hour,
    writeFrequency: row.write_frequency,
    writeWeekday: row.write_weekday,
    writeHour: row.write_hour,
  };
}
