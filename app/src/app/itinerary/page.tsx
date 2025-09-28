// Page-level wrapper for the travel itinerary builder. This component
// renders the TravelSuggestionPage, which implements the full itinerary
// builder UI. Placing it under `/itinerary` allows us to link to
// this tool from the main navigation.

// Client-side itinerary page. This page wraps the TravelSuggestionPage
// component. It must be a client component because the underlying
// TravelSuggestionPage uses state and browser APIs.

'use client';

import React from 'react';
import TravelSuggestionPage from '../components/TravelSuggestionPage';

export default function ItineraryPage() {
  return <TravelSuggestionPage />;
}