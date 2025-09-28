// API route for generating travel itineraries based on city, trip length,
// budget and interests. Inspired by the provided server example in the
// TravelZ-Itinerary_Function package.

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// Utility: build an itinerary entry for a day
function makeDay(title: string, estimated: number, blocks: any[]) {
  return { title, estimated, blocks };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const city: string = body.city || '';
    const tripType: string = body.tripType || '';
    const budget: number = Number(body.budget) || 0;
    const length: number = Number(body.length) || 1;
    const interests: string[] = Array.isArray(body.interests) ? body.interests : [];

    const days: any[] = [];
    const lowerCity = city.toLowerCase();
    for (let d = 0; d < length; d++) {
      const estimated = Math.round(budget / length);

      // Atlanta-specific sample itinerary (day-by-day)
      if (lowerCity === 'atlanta') {
        if (d === 0) {
          days.push(
            makeDay(`${city} Day ${d + 1}`, estimated, [
              {
                when: 'Morning',
                activity: interests.includes('nightlife')
                  ? 'Brunch at Atlanta Breakfast Club'
                  : interests.includes('history')
                  ? 'Stroll at the Martin Luther King Jr. National Historical Park & visit to the original Ebenezer Baptist Church'
                  : interests.includes('art')
                  ? 'Visit to High Mueseum of arts'
                  : 'Brunch at Atlanta Breakfast Club',
                address: interests.includes('nightlife')
                  ? 'Atlanta Breakfast CLub'
                  : interests.includes('history')
                  ? 'Martin Luther King Jr. Park'
                  : interests.includes('art')
                  ? 'High Mueseum of Art'
                  : 'Atlanta Breakfast Club',
              },
              {
                when: 'Afternoon',
                activity: interests.includes('nightlife')
                  ? 'Walk at the Centennial Olympic park and ride in the skyview Atlanta Ferris Wheel'
                  : interests.includes('history')
                  ? 'Walk to the National Center for Civil and Human Rights'
                  : interests.includes('art')
                  ? 'Visit to Museum of Design Atlanta'
                  : 'Brunch at Atlanta Breakfast Club',
                address: interests.includes('nightlife')
                  ? 'Centennial Olympic Park'
                  : interests.includes('history')
                  ? 'National center for civil and human rights'
                  : interests.includes('art')
                  ? 'Museum of Design Atlanta(MODA)'
                  : 'Atlanta Breakfast Club',
              },
              {
                when: 'Evening',
                activity: interests.includes('nightlife')
                  ? 'Dinner and arcade games at Joystick GameBar'
                  : interests.includes('history')
                  ? 'Dinner at Paschal Restaurant'
                  : interests.includes('art')
                  ? 'Dinner at the Arts District'
                  : 'Brunch at Atlanta Breakfast Club',
                address: interests.includes('nightlife')
                  ? 'Edgewood Avenue'
                  : interests.includes('history')
                  ? 'Paschal Restaurant'
                  : interests.includes('art')
                  ? 'Arts District'
                  : 'Atlanta Breakfast Club',
              },
            ])
          );
        } else if (d === 1) {
          days.push(
            makeDay(`${city} Day ${d + 1}`, estimated, [
              {
                when: 'Morning',
                activity: interests.includes('nightlife')
                  ? 'Late Brunch at the Flying Biscuit Cafe'
                  : interests.includes('history')
                  ? 'Spend the morning at Atlanta History Center'
                  : interests.includes('art')
                  ? 'Explore Murals of Cabbagetown'
                  : 'Brunch at Atlanta Breakfast Club',
                address: interests.includes('nightlife')
                  ? 'Midtown'
                  : interests.includes('history')
                  ? 'Atlanta History Center'
                  : interests.includes('art')
                  ? 'Cabbagetown'
                  : 'Atlanta Breakfast Club',
              },
              {
                when: 'Afternoon',
                activity: interests.includes('nightlife')
                  ? 'Stroll through Piedmont park and lunch at politan row at colony square'
                  : interests.includes('history')
                  ? 'Visit to the Oakland Cemetery'
                  : interests.includes('art')
                  ? 'Rent a bike or scooter to travel the Beltline Trail'
                  : 'Brunch at Atlanta Breakfast Club',
                address: interests.includes('nightlife')
                  ? 'Midtown'
                  : interests.includes('history')
                  ? 'Oakland Cemetery'
                  : interests.includes('art')
                  ? 'Beltline'
                  : 'Atlanta Breakfast Club',
              },
              {
                when: 'Evening',
                activity: interests.includes('nightlife')
                  ? 'Clubbing at Toungue and groove or Believe Music Hall'
                  : interests.includes('history')
                  ? 'Explore the Catleberry Hill Historic District'
                  : interests.includes('art')
                  ? 'Dinner at Inman Park'
                  : 'Brunch at Atlanta Breakfast Club',
                address: interests.includes('nightlife')
                  ? 'Midtown'
                  : interests.includes('history')
                  ? 'Castleberry Hill District'
                  : interests.includes('art')
                  ? 'Inman Park'
                  : 'Atlanta Breakfast Club',
              },
            ])
          );
        } else if (d === 2) {
          days.push(
            makeDay(`${city} Day ${d + 1}`, estimated, [
              {
                when: 'Morning',
                activity: interests.includes('nightlife')
                  ? 'Brunch at Ponce City Market'
                  : interests.includes('history')
                  ? 'Visit to the Jimmy Carter Presidential Library'
                  : interests.includes('art')
                  ? 'Visit to Atlanta Contemporary Arts Center'
                  : 'Brunch at Atlanta Breakfast Club',
                address: interests.includes('nightlife')
                  ? 'Ponce City Market'
                  : interests.includes('history')
                  ? 'Jimmy Carter presidential Library and Museum'
                  : interests.includes('art')
                  ? 'Atlanta Contemporary Arts Center'
                  : 'Atlanta Breakfast Club',
              },
              {
                when: 'Afternoon',
                activity: interests.includes('nightlife')
                  ? 'Walk at the Atlanta Beltline Trail and drinks at Two Urban Licks'
                  : interests.includes('history')
                  ? 'Tour of the Margaret Mitchell House'
                  : interests.includes('art')
                  ? 'Visit to Westside Arts District'
                  : 'Brunch at Atlanta Breakfast Club',
                address: interests.includes('nightlife')
                  ? 'Atlanta Beltline'
                  : interests.includes('history')
                  ? 'Margaret Mitchell House'
                  : interests.includes('art')
                  ? 'Westside Arts District'
                  : 'Atlanta Breakfast Club',
              },
              {
                when: 'Evening',
                activity: interests.includes('nightlife')
                  ? 'Grab a burger at The Votex and catch a show at The Variety Playhouse'
                  : interests.includes('history')
                  ? 'Guided Tour of the Fox Theatre'
                  : interests.includes('art')
                  ? 'Dinner at Westside Provisions District'
                  : 'Brunch at Atlanta Breakfast Club',
                address: interests.includes('nightlife')
                  ? 'Little Five Points'
                  : interests.includes('history')
                  ? 'Fox Theatre'
                  : interests.includes('art')
                  ? 'Westside Provision District'
                  : 'Atlanta Breakfast Club',
              },
            ])
          );
        } else {
          // Day 4 and beyond generic for Atlanta
          days.push(
            makeDay(`${city} Day ${d + 1}`, estimated, [
              { when: 'Morning', activity: 'Sophisticated breakfast or local brunch', address: '' },
              { when: 'Afternoon', activity: 'Shopping or cultural sites' },
              {
                when: 'Evening',
                activity: interests.includes('nightlife')
                  ? '18+ friendly live music / bar'
                  : 'Chill dinner spot',
              },
            ])
          );
        }
      } else if (lowerCity === 'miami') {
        // Miami itinerary sample
        if (d === 0) {
          days.push(
            makeDay(`${city} Day ${d + 1}`, estimated, [
              { when: 'Morning', activity: 'Chill at the South Beach', address: '' },
              { when: 'Afternoon', activity: 'Grab lunch at the Ocean Drive' },
              {
                when: 'Evening',
                activity: interests.includes('nightlife')
                  ? 'Dinner at South of Fifth(SoFi)'
                  : 'Watch the sunset at the South Pointe Park',
              },
            ])
          );
        } else if (d === 1) {
          days.push(
            makeDay(`${city} Day ${d + 1}`, estimated, [
              { when: 'Morning', activity: 'Explore the Wynwood Neighborhood' },
              { when: 'Afternoon', activity: 'Immerse yourself in Cuban Culture in Little Havana' },
              {
                when: 'Evening',
                activity: interests.includes('nightlife')
                  ? 'Salsa at Ball & Chain'
                  : 'Authentic Cuban Dinner at Versailles',
              },
            ])
          );
        } else if (d === 2) {
          days.push(
            makeDay(`${city} Day ${d + 1}`, estimated, [
              { when: 'Morning', activity: 'Historic Trip to Vizcaya Museum and Gardens' },
              { when: 'Afternoon', activity: 'Shopping at Bayside Marketplace' },
              { when: 'Evening', activity: 'Dinner at Brickell City Centre' },
            ])
          );
        } else if (d === 3) {
          days.push(
            makeDay(`${city} Day ${d + 1}`, estimated, [
              { when: 'Morning', activity: 'Trip to Everglades National Park' },
              { when: 'Afternoon', activity: 'Drive over to Key Biscayne Island' },
              { when: 'Evening', activity: 'Enjoy the Bohemian vibe of Coconut Grove!' },
            ])
          );
        } else {
          // Generic days for Miami beyond day 4
          days.push(
            makeDay(`${city} Day ${d + 1}`, estimated, [
              { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
              { when: 'Afternoon', activity: 'Main attraction / beach / park' },
              {
                when: 'Evening',
                activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : 'Chill dinner spot',
              },
            ])
          );
        }
      } else {
        // Generic fallback itinerary for other cities (or for Seattle/Houston)
        days.push(
          makeDay(`${city} Day ${d + 1}`, estimated, [
            { when: 'Morning', activity: 'Local breakfast and Stroll', address: 'Central area' },
            { when: 'Afternoon', activity: 'Main attraction / beach / park' },
            {
              when: 'Evening',
              activity: interests.includes('nightlife') ? '18+ friendly live music / bar' : 'Chill dinner spot',
            },
          ])
        );
      }
    }
    const estimated_total = days.reduce((s, x) => s + x.estimated, 0);
    return NextResponse.json({ days, estimated_total });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'error' }, { status: 500 });
  }
}