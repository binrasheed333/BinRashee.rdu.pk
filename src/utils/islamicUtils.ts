import { Coordinates, CalculationMethod, PrayerTimes, Qibla } from 'adhan';
import moment from 'moment-hijri';

export function getPrayerTimes(lat: number, lng: number, date: Date = new Date(), offsets: Record<string, number> = {}) {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.MuslimWorldLeague();
  const prayerTimes = new PrayerTimes(coords, date, params);
  
  const times = {
    fajr: prayerTimes.fajr,
    sunrise: prayerTimes.sunrise,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
  };

  // Apply offsets
  if (offsets) {
    Object.keys(offsets).forEach(key => {
      if (times[key as keyof typeof times]) {
        const date = new Date(times[key as keyof typeof times]);
        date.setMinutes(date.getMinutes() + (offsets[key] || 0));
        times[key as keyof typeof times] = date;
      }
    });
  }
  
  return times;
}

export function getIslamicDate(date: Date = new Date(), offset: number = 0) {
  const m = moment(date);
  if (offset !== 0) {
    m.add(offset, 'days');
  }
  return m.format('iD iMMMM iYYYY');
}

export function getHijriMonthInfo(date: Date = new Date(), offset: number = 0) {
  const m = moment(date);
  if (offset !== 0) {
    m.add(offset, 'days');
  }
  return {
    day: m.iDate(),
    month: m.iMonth(), // 0-indexed
    monthName: m.format('iMMMM'),
    year: m.iYear(),
    daysInMonth: moment.iDaysInMonth(m.iYear(), m.iMonth())
  };
}

export function calculateQibla(lat: number, lng: number) {
  const coords = new Coordinates(lat, lng);
  return Qibla(coords);
}
