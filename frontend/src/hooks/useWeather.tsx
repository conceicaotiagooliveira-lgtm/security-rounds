import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow } from 'lucide-react';

export function useWeather() {
  const [weather, setWeather] = useState({ temp: 22, code: 0 });

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data && data.current_weather) {
          setWeather({ 
            temp: Math.round(data.current_weather.temperature), 
            code: data.current_weather.weathercode 
          });
        }
      } catch (err) {
        console.error("Erro ao buscar clima:", err);
      }
    };

    const fallbackToIP = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.latitude && data.longitude) {
          fetchWeather(data.latitude, data.longitude);
        } else {
          fetchWeather(-23.5505, -46.6333); // São Paulo
        }
      } catch (err) {
        console.warn("Falha ao obter localização por IP. Usando São Paulo.", err);
        fetchWeather(-23.5505, -46.6333); // São Paulo
      }
    };

    const updateWeather = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            fetchWeather(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.warn("Geolocalização não permitida ou falhou. Tentando via IP...", error);
            fallbackToIP();
          },
          { timeout: 10000 }
        );
      } else {
        fallbackToIP();
      }
    };

    updateWeather();
    const interval = setInterval(updateWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherStyle = () => {
    const code = weather.code;
    if (code === 0 || code === 1) return { icon: <Sun className="w-4 h-4" />, colorClass: "text-amber-500 bg-amber-50" };
    if (code === 2 || code === 3 || code === 45 || code === 48) return { icon: <Cloud className="w-4 h-4" />, colorClass: "text-slate-500 bg-slate-100" };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { icon: <CloudRain className="w-4 h-4" />, colorClass: "text-blue-500 bg-blue-50" };
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return { icon: <CloudSnow className="w-4 h-4" />, colorClass: "text-sky-500 bg-sky-50" };
    if (code >= 95 && code <= 99) return { icon: <CloudLightning className="w-4 h-4" />, colorClass: "text-purple-600 bg-purple-50" };
    return { icon: <Sun className="w-4 h-4" />, colorClass: "text-amber-500 bg-amber-50" };
  };

  return {
    temp: weather.temp,
    style: getWeatherStyle()
  };
}
