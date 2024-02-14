import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
//Integrantes del equipo del 5D
//Ashly Bairan Ines
//Ángel Osvaldo González Rojas
//Angel Gomez García
//Giovanni Cuaya Morales
const App = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [chartLoaded, setChartLoaded] = useState(false);
  const chartRef = useRef(null);
  const [searchCity, setSearchCity] = useState('');
  const [mapEmbed, setMapEmbed] = useState('');
  const [error, setError] = useState(null);

  const API_KEY = '8afa185578222e47eaec781d1191004f';

  const getWeatherAndForecastData = async (city) => {
    try {
      const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
      if (!weatherResponse.ok) {
        throw new Error('Error al obtener datos del clima');
      }
      const weatherData = await weatherResponse.json();
      setWeatherData(weatherData);

      const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&cnt=40&appid=${API_KEY}`);
      if (!forecastResponse.ok) {
        throw new Error('Error al obtener datos del pronóstico');
      }
      const forecastData = await forecastResponse.json();
      setForecastData(forecastData.list);

    
      setMapEmbed(`https://www.openstreetmap.org/export/embed.html?bbox=${weatherData.coord.lon - 1}%2C${weatherData.coord.lat - 1}%2C${weatherData.coord.lon + 1}%2C${weatherData.coord.lat + 1}&amp;layer=mapnik`);

      setChartLoaded(true);
      setError(null); 
    } catch (error) {
      console.error('Error fetching weather and forecast data:', error);
      setError(error.message); 
    }
  };

  const handleSearch = async () => {
    if (searchCity.trim() !== '') {
      await getWeatherAndForecastData(searchCity);
    } else {
      setError('Por favor ingrese un nombre de ciudad');
    }
  };

  useEffect(() => {
    if (searchCity) {
      getWeatherAndForecastData(searchCity);
    }
  }, [searchCity]);

  useEffect(() => {
    if (chartLoaded && forecastData.length > 0 && chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      const labels = forecastData.map(item => new Date(item.dt * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
      const temperatures = forecastData.map(item => item.main.temp);

     
      if (chartRef.current.chartInstance) {
        chartRef.current.chartInstance.destroy();
      }

      chartRef.current.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Temperature (°C)',
            data: temperatures,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: false
            }
          }
        }
      });
    }
  }, [chartLoaded, forecastData]);

  const uniqueDays = forecastData.reduce((acc, curr) => {
    const date = new Date(curr.dt * 1000);
    const day = date.toLocaleDateString('es-ES', { weekday: 'long' });
    if (!acc.some(item => item.day === day)) {
      acc.push({ day, data: curr });
    }
    return acc;
  }, []);

  return (
    <>
      <div className='container mt-5'>
        <div className='row'>
          <div className='col-12'>
            <div className="input-group input-group-lg">
              <input 
                type="text" 
                className="form-control" 
                placeholder='Nombre de la Ciudad' 
                value={searchCity} 
                onChange={(e) => setSearchCity(e.target.value)} 
              />
              <div className="input-group-append">
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleSearch}
                >
                  Buscar
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            Error: {error}
          </div>
        )}

        {weatherData && (
          <div className='row mt-3'>
            <div className='col'>
              <div className="card mx-auto" style={{ maxWidth: '18rem' }}>
                <div className="card-body">
                  <h5 className="card-title text-center">Clima de la ciudad de {weatherData.name}</h5>
                  <p className="card-text text-center">Temperatura: {weatherData.main.temp} °C</p>
                  <p className="card-text text-center">Sensación térmica: {weatherData.main.feels_like} °C</p>
                  <p className="card-text text-center">Descripción: {weatherData.weather[0].description}</p>
                  <p className="card-text text-center">Velocidad del viento: {weatherData.wind.speed} m/s</p>
                  <p className="card-text text-center">Visibilidad: {weatherData.visibility} metros</p>
                  <p className="card-text text-center">Humedad: {weatherData.main.humidity}%</p>
                  <div className="text-center">
                    <img src={`http://openweathermap.org/img/wn/${weatherData.weather[0].icon}.png`} alt="Weather Icon" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mapEmbed && (
          <div className='row mt-5'>
            <div className='col-12'>
              <iframe
                width="100%"
                height="300"
                title="Mapa de la ciudad"
                src={mapEmbed}
                style={{ border: '1px solid #ccc', borderRadius: '5px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        <div className='row mt-5'>
          <div className='col'>
            <h2 className="text-center">Gráfico de Temperatura</h2>
            <div className="chart-container">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        </div>

        {uniqueDays.length > 0 && (
          <div className="row mt-5">
            <div className="col">
              <h2 className="text-center">Pronóstico para los próximos 5 días</h2>
              <div className="d-flex flex-row">
                {uniqueDays.map((item, index) => (
                  <div key={index} className="mr-3">
                    <h5>{item.day}</h5>
                    <p className="mb-1">Temperatura Máxima: {item.data.main.temp_max} °C</p>
                    <p className="mb-1">Temperatura Mínima: {item.data.main.temp_min} °C</p>
                    <p className="mb-1">Descripción: {item.data.weather[0].description}</p>
                    <div className="text-center">
                      <img src={`http://openweathermap.org/img/wn/${item.data.weather[0].icon}.png`} alt="Weather Icon" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default App;
