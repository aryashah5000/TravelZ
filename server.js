/*
--------------------------------------------------------------
Server-side example (Node + Express) — place in your server, NOT in frontend code
--------------------------------------------------------------
*/
// server.js (example)
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // allow cross-origin requests from frontend

const PORT = process.env.PORT || 4000;

// Ticketmaster API endpoint
app.get('/api/events', async (req, res) => {
  const city = req.query.city || 'Miami';
  const ticketmasterKey = process.env.TICKETMASTER_API_KEY;

  try {
    const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?city=${encodeURIComponent(city)}&apikey=${ticketmasterKey}`);
    const data = await response.json();
    const events = (data._embedded && data._embedded.events || []).map(e => ({
      name: e.name,
      venue: (e._embedded && e._embedded.venues && e._embedded.venues[0].name) || '',
      date: e.dates?.start?.localDate || ''
    }));
    res.json({ events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Simple itinerary endpoint
app.post('/api/itinerary', async (req, res) => {
  const { city, tripType, budget, interests, length } = req.body;
  const days = [];

  for (let d = 0; d < length; d++) {
//Atlanta
    if (city.toLowerCase() === 'atlanta') {
      if (d == 0) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: interests.includes('nightlife') ? 'Brunch at Atlanta Breakfast Club' : interests.includes('history') ? 'Stroll at the Martin Luther King Jr. National Historical Park & visit to the original Ebenezer Baptist Church' : interests.includes('art') ? 'Visit to High Mueseum of arts' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Atlanta Breakfast CLub' : interests.includes('history') ? 'Martin Luther King Jr. Park' : interests.includes('art') ? 'High Mueseum of Art' : 'Atlanta Breakfast Club' },
            { when: 'Afternoon', activity: interests.includes('nightlife') ? 'Walk at the Centennial Olympic park and ride in the skyview Atlanta Ferris Wheel' : interests.includes('history') ? 'Walk to the National Center for Civil and Human Rights' : interests.includes('art') ? 'Visit to Museum of Design Atlanta' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Centennial Olympic Park' : interests.includes('history') ? 'National center for civil and human rights' : interests.includes('art') ? 'Museum of Design Atlanta(MODA)' : 'Atlanta Breakfast Club' },
            { when: 'Evening', activity: interests.includes('nightlife') ? 'Dinner and arcade games at Joystick GameBar' : interests.includes('history') ? 'Dinner at Paschal Restaurant' : interests.includes('art') ? 'Dinner at the Arts District' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Edgewood Avenue' : interests.includes('history') ? 'Paschal Restaurant' : interests.includes('art') ? 'Arts District' : 'Atlanta Breakfast Club' }
          ]
        });

      }

      else if (d == 1) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
             { when: 'Morning', activity: interests.includes('nightlife') ? 'Late Brunch at the Flying Biscuit Cafe' : interests.includes('history') ? 'Spend the morning at Atlanta History Center' : interests.includes('art') ? 'Explore Murals of Cabbagetown' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Midtown' : interests.includes('history') ? 'Atlanta History Center' : interests.includes('art') ? 'Cabbagetown' : 'Atlanta Breakfast Club' },
            { when: 'Afternoon', activity: interests.includes('nightlife') ? 'Stroll through Piedmont park and lunch at politan row at colony square' : interests.includes('history') ? 'Visit to the Oakland Cemetery' : interests.includes('art') ? 'Rent a bike or scooter to travel the Beltline Trail' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Midtown' : interests.includes('history') ? 'Oakland Cemetery' : interests.includes('art') ? 'Beltline' : 'Atlanta Breakfast Club' },
            { when: 'Evening', activity: interests.includes('nightlife') ? 'Clubbing at Toungue and groove or Believe Music Hall' : interests.includes('history') ? 'Explore the Catleberry Hill Historic District' : interests.includes('art') ? 'Dinner at Inman Park' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Midtown' : interests.includes('history') ? 'Castleberry Hill District' : interests.includes('art') ? 'Inman Park' : 'Atlanta Breakfast Club' }
          ]
        });

      }

      else if (d == 2) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
             { when: 'Morning', activity: interests.includes('nightlife') ? 'Brunch at Ponce City Market' : interests.includes('history') ? 'Visit to the Jimmy Carter Presidential Library' : interests.includes('art') ? 'Visit to Atlanta Contemporary Arts Center' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Ponce City Market' : interests.includes('history') ? 'Jimmy Carter presidential Library and Museum' : interests.includes('art') ? 'Atlanta Contemporary Arts Center' : 'Atlanta Breakfast Club' },
            { when: 'Afternoon', activity: interests.includes('nightlife') ? 'Walk at the Atlanta Beltline Trail and drinks at Two Urban Licks' : interests.includes('history') ? 'Tour of the Margaret Mitchell House' : interests.includes('art') ? 'Visit to Westside Arts District' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Atlanta Beltline' : interests.includes('history') ? 'Margaret Mitchell House' : interests.includes('art') ? 'Westside Arts District' : 'Atlanta Breakfast Club' },
            { when: 'Evening', activity: interests.includes('nightlife') ? 'Grab a burger at The Votex and catch a show at The Variety Playhouse' : interests.includes('history') ? 'Guided Tour of the Fox Theatre' : interests.includes('art') ? 'Dinner at Westside Provisions District' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Little Five Points' : interests.includes('history') ? 'Fox Theatre' : interests.includes('art') ? 'Westside Provision District' : 'Atlanta Breakfast Club' }
          ]
        });

      }

      else if (d == 3) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
             { when: 'Morning', activity: interests.includes('nightlife') ? 'Sophisticated Breakfast at The Southern Gentleman' : interests.includes('history') ? 'Tour of the Georgia Capitol' : interests.includes('art') ? 'Visit the SCAD museum of Fasion and Film' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Buckhead' : interests.includes('history') ? 'Georgia State Capitol' : interests.includes('art') ? 'SCAD' : 'Atlanta Breakfast Club' },
            { when: 'Afternoon', activity: interests.includes('nightlife') ? 'Shopping at Lenox mall' : interests.includes('history') ? 'Visit to World of Coca Cola & Monetary Museum' : interests.includes('art') ? 'Explore the puppetry Mueseum' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Buckhead' : interests.includes('history') ? 'World of Coca Cola' : interests.includes('art') ? 'Center for Puppetry Arts' : 'Atlanta Breakfast Club' },
            { when: 'Evening', activity: interests.includes('nightlife') ? 'Throwback Dance Party at Johnnys Hideaway' : interests.includes('history') ? 'Farewell Dinner at Mary Macs Tearoom' : interests.includes('art ') ? 'Catch a foreign or independant film at Plaza Theatre' : 'Brunch at Atlanta Breakfast Club', address: interests.includes('nightlife') ? 'Buckhead' : interests.includes('history') ? 'Mary Macs Tea Room' : interests.includes('art') ? 'Plaza Theatre' : 'Atlanta Breakfast Club' }
          ]
        });

      }
    }
//Seatle
    else if (city.toLowerCase() === 'seattle') {
      if (d == 0) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Watch Fish Throwing and have breakfast at Piroshky Piroshky', address: 'Pike Place Market' },
            { when: 'Afternoon', activity: 'Argosy Cruise Harbour Tour' , address : 'Seattle Waterfront'},
            { when: 'Evening', activity: interests.includes('nightlife') ? 'Beneath the Streets underground tour' : ('Beneath the Streets underground tour'), address : 'Pioneer Square'}
          ]
        });

      }

      else if (d == 1) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Go up the iconic Space Needle',  },
            { when: 'Afternoon', activity: 'Visit the Glass Museum and The Museum of Pop Culture' },
            { when: 'Evening', activity: interests.includes('nightlife') ? 'Shopping and dinner at Capitol Hill' : ('Shopping and dinner at Capitol Hill') }
          ]
        });

      }

      else if (d == 2) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Hike the loop trail' },
            { when: 'Afternoon', activity: 'Boeing future of flight tour' },
            { when: 'Evening', activity:  ('Explore the Lake Union') }
          ]
        });

      }

      else if (d == 3) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Wander the Fremont Neighbourhood' },
            { when: 'Afternoon', activity: 'Watch the Hiram M. Chittenden Locks (Ballard Locks)' },
            { when: 'Evening', activity: interests.includes('nightlife') ? 'Stroll down the Ballard Avenue' : ('Stroll down the Ballard Avenue') }
          ]
        });

      }
    }
//Boston
    else if (city.toLowerCase() === 'boston') {
      if (d == 0) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
            { when: 'Afternoon', activity: 'Main attraction / beach / park' },
            { when: 'Evening', activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : ('Chill dinner spot') }
          ]
        });

      }

      else if (d == 1) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
            { when: 'Afternoon', activity: 'Main attraction / beach / park' },
            { when: 'Evening', activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : ('Chill dinner spot') }
          ]
        });

      }

      else if (d == 2) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
            { when: 'Afternoon', activity: 'Main attraction / beach / park' },
            { when: 'Evening', activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : ('Chill dinner spot') }
          ]
        });

      }

      else if (d == 3) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
            { when: 'Afternoon', activity: 'Main attraction / beach / park' },
            { when: 'Evening', activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : ('Chill dinner spot') }
          ]
        });

      }
    }
//Houston
    else if (city.toLowerCase() === 'houston') {
      if (d == 0) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
            { when: 'Afternoon', activity: 'Main attraction / beach / park' },
            { when: 'Evening', activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : ('Chill dinner spot') }
          ]
        });

      }

      else if (d == 1) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
            { when: 'Afternoon', activity: 'Main attraction / beach / park' },
            { when: 'Evening', activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : ('Chill dinner spot') }
          ]
        });

      }

      else if (d == 2) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
            { when: 'Afternoon', activity: 'Main attraction / beach / park' },
            { when: 'Evening', activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : ('Chill dinner spot') }
          ]
        });

      }

      else if (d == 3) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
            { when: 'Afternoon', activity: 'Main attraction / beach / park' },
            { when: 'Evening', activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : ('Chill dinner spot') }
          ]
        });

      }
    }
//Miami
    else if (city.toLowerCase() === 'miami') {
      if (d == 0) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Chill at the South Beach', address: '' },
            { when: 'Afternoon', activity: 'Grab lunch at the Ocean Drive' },
            { when: 'Evening', activity: interests.includes('nightlife') ? 'Dinner at South of Fifth(SoFi)' : ('Watch the sunset at the South Pointe Park') }
          ]
        });

      }

      else if (d == 1) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Explore the Wynwood Neighborhood'},
            { when: 'Afternoon', activity: 'Immerse yourself in Cuban Culture in Little Havana' },
            { when: 'Evening', activity: interests.includes('nightlife') ? 'Salsa at Ball & Chain' : ('Authentic Cuban Dinner at Versailles') }
          ]
        });

      }

      else if (d == 2) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Historic Trip to Vizcaya Museum and Gardens'},
            { when: 'Afternoon', activity: 'Shopping at Bayside Marketplace' },
            { when: 'Evening', activity:  ('Dinner at Brickell City Centre') }
          ]
        });

      }

      else if (d == 3) {
        days.push({
          title: `${city} Day ${d + 1}`,
          estimated: Math.round(budget / length),
          blocks: [
            { when: 'Morning', activity: 'Trip to Everglades National Park' },
            { when: 'Afternoon', activity: 'Drive over to Key Biscayne Island' },
            { when: 'Evening', activity:  ('Enjoy the Bohemian vibe of Coconut Grove!') }
          ]
        });

      }
    }
    else {
      days.push({
      title: `${city} Day ${d + 1}`,
      estimated: Math.round(budget / length),
      blocks: [
        { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
        { when: 'Afternoon', activity: 'Main attraction / beach / park' },
        { when: 'Evening', activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : ('Chill dinner spot') }
      ]
    });
    }




    // days.push({
    //   title: `${city} Day ${d + 1}`,
    //   estimated: Math.round(budget / length),
    //   blocks: [
    //     { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
    //     { when: 'Afternoon', activity: 'Main attraction / beach / park' },
    //     { when: 'Evening', activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : ('Chill dinner spot') }
    //   ]
    // });
  }

  const estimated_total = days.reduce((s, x) => s + x.estimated, 0);
  res.json({ days, estimated_total });
});

// Maps key endpoint
app.get('/api/maps-key', (req, res) => {
  res.json({ key: process.env.GOOGLE_MAPS_KEY });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


/*
--------------------------------------------------------------
Security & integration notes (in-server):
- Never embed API keys in frontend JS. Use server endpoints to proxy or to return short-lived tokens.
- For services requiring OAuth (Spotify), implement the Authorization Code flow or PKCE on the server.
- Rate limit and cache responses (events, places) to avoid quota exhaustion.
- Validate user input on server to prevent injection.
*/
