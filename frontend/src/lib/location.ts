import exifr from "exifr";

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface ExifGpsResult extends GeoPoint {
    altitude?: number;
}

export interface IpLocationResult extends GeoPoint {
    cityName?: string;
    regionName?: string;
    countryName?: string;
}

/**
 * Extracts real-time satellite GPS coordinates embedded inside photo EXIF metadata.
 * When citizens photograph civic issues on their smartphone, GPS coordinates are embedded
 * directly in the image file.
 */
export async function extractExifGps(file: File): Promise<ExifGpsResult | null> {
    try {
        const gps = await exifr.gps(file);
        if (
            gps &&
            typeof gps.latitude === "number" &&
            typeof gps.longitude === "number" &&
            !isNaN(gps.latitude) &&
            !isNaN(gps.longitude)
        ) {
            return {
                lat: gps.latitude,
                lng: gps.longitude,
            };
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Fallback to IP-based geolocation when browser GPS hardware is absent
 * or Windows location services are disabled/defaulted.
 */
export async function getIpLocation(): Promise<IpLocationResult | null> {
    // Attempt 1: freeipapi.com
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://freeipapi.com/api/json", {
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (
                typeof data.latitude === "number" &&
                typeof data.longitude === "number" &&
                !isNaN(data.latitude) &&
                !isNaN(data.longitude)
            ) {
                return {
                    lat: data.latitude,
                    lng: data.longitude,
                    cityName: data.cityName || undefined,
                    regionName: data.regionName || undefined,
                    countryName: data.countryName || undefined,
                };
            }
        }
    } catch {
        // Fallback to secondary provider if freeipapi fails or times out
    }

    // Attempt 2: ipwho.is
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://ipwho.is/", {
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (
                data.success !== false &&
                typeof data.latitude === "number" &&
                typeof data.longitude === "number" &&
                !isNaN(data.latitude) &&
                !isNaN(data.longitude)
            ) {
                return {
                    lat: data.latitude,
                    lng: data.longitude,
                    cityName: data.city || undefined,
                    regionName: data.region || undefined,
                    countryName: data.country || undefined,
                };
            }
        }
    } catch {
        // Non-fatal
    }

    return null;
}
