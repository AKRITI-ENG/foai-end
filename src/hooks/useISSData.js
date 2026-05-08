import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

// Haversine formula to calculate distance between two points on the Earth
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRadian = (angle) => (Math.PI / 180) * angle;
  const distance = (a, b) => (Math.PI / 180) * (a - b);
  const RADIUS_OF_EARTH_IN_KM = 6371;

  const dLat = distance(lat2, lat1);
  const dLon = distance(lon2, lon1);

  const lat1Rad = toRadian(lat1);
  const lat2Rad = toRadian(lat2);

  // a is the square of half the chord length between the points
  const a =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  
  // c is the angular distance in radians
  const c = 2 * Math.asin(Math.sqrt(a));

  return RADIUS_OF_EARTH_IN_KM * c;
};

export const useISSData = () => {
  const [position, setPosition] = useState(null);
  const [path, setPath] = useState([]);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [speed, setSpeed] = useState(0); // km/h
  const [locationName, setLocationName] = useState('Loading...');
  const [astros, setAstros] = useState({ number: 0, people: [] });
  const [error, setError] = useState(null);
  
  const lastTimeRef = useRef(null);
  const lastPosRef = useRef(null); // Fix infinite loop by storing latest pos in ref

  // Fetch astronauts once
  useEffect(() => {
    const fetchAstros = async () => {
      try {
        const res = await axios.get('/api/iss/astros.json');
        setAstros({
          number: res.data.number,
          people: res.data.people.filter((p) => p.craft === 'ISS'),
        });
      } catch (err) {
        console.error('Error fetching astros:', err);
      }
    };
    fetchAstros();
  }, []);

  const fetchISS = useCallback(async () => {
    try {
      const res = await axios.get('/api/iss/iss-now.json');
      const { latitude, longitude } = res.data.iss_position;
      const lat = parseFloat(latitude);
      const lon = parseFloat(longitude);
      const currentTime = Date.now();

      setPosition({ lat, lon });

      setPath((prev) => {
        const newPath = [...prev, { lat, lon }];
        // Keep last 15 positions
        if (newPath.length > 15) return newPath.slice(newPath.length - 15);
        return newPath;
      });

      // Calculate speed using refs to avoid infinite loops from useCallback dependencies
      if (lastTimeRef.current && lastPosRef.current) {
        const prevPos = lastPosRef.current;
        const distance = calculateDistance(prevPos.lat, prevPos.lon, lat, lon); // km
        const timeElapsedHours = (currentTime - lastTimeRef.current) / (1000 * 60 * 60); // hours

        let currentSpeed = 0;
        if (timeElapsedHours > 0) {
          currentSpeed = distance / timeElapsedHours;
        }
        
        // ISS moves at ~28,000 km/h, some API jitters might give weird values so we cap or smooth it if needed
        if (currentSpeed > 0 && currentSpeed < 40000) {
          setSpeed(currentSpeed);
          setSpeedHistory((prev) => {
            const newHist = [...prev, { time: new Date().toLocaleTimeString(), speed: currentSpeed }];
            if (newHist.length > 30) return newHist.slice(newHist.length - 30);
            return newHist;
          });
        }
      }
      lastTimeRef.current = currentTime;
      lastPosRef.current = { lat, lon };

      // Fetch nearest location name via reverse geocoding
      try {
        const geoRes = await axios.get(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
        );
        if (geoRes.data) {
          const place = geoRes.data.city || geoRes.data.locality || geoRes.data.principalSubdivision || geoRes.data.countryName || 'Ocean / Unknown';
          setLocationName(place);
        } else {
           setLocationName('Ocean');
        }
      } catch (geoErr) {
        setLocationName('Ocean / Unknown');
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching ISS data:', err);
      setError('Failed to fetch ISS data');
    }
  }, []); // Empty dependency array prevents infinite loop

  useEffect(() => {
    fetchISS();
    const interval = setInterval(fetchISS, 15000); // every 15s

    return () => clearInterval(interval);
  }, [fetchISS]);

  return { position, path, speed, speedHistory, locationName, astros, error, forceRefresh: fetchISS };
};
