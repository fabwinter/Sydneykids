import { useState, useEffect } from "react";

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Sydney coordinates: -33.8688, 151.2093
        const resp = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-33.8688&longitude=151.2093&current=temperature_2m,weather_code&timezone=Australia%2FSydney"
        );
        if (!resp.ok) return;
        const data = await resp.json();
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code as number;

        // Map WMO weather codes to description and emoji
        let description = "Clear";
        let icon = "☀️";
        if (code === 0) { description = "Clear"; icon = "☀️"; }
        else if (code <= 3) { description = "Cloudy"; icon = "⛅"; }
        else if (code <= 49) { description = "Foggy"; icon = "🌫️"; }
        else if (code <= 69) { description = "Rain"; icon = "🌧️"; }
        else if (code <= 79) { description = "Snow"; icon = "❄️"; }
        else if (code <= 99) { description = "Storm"; icon = "⛈️"; }

        setWeather({ temp, description, icon });
      } catch {
        // Silently fail - weather is non-critical
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return weather;
}
