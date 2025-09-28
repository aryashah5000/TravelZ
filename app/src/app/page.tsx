'use client';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import React, { use, useState } from "react";
import { MockProvider } from "@/lib/providers/mock"; // <-- your mock file
import { Hotel } from "@/types";
import { userAgent } from 'next/server';


const LandingPage: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Mock location (Sacramento coords)
    const lat = 38.58;
    const lng = -121.49;
    setLoading(false);

    const results = await MockProvider.searchNearby({ lat, lng, radiusKm: 30 });
    setHotels(results);
    setLoading(false);
  }

  return (
    <div className="font-sans text-gray-800 bg-gray-100">
      {/* Header */}
      <header className="bg-white text-gray-800 shadow-md w-full">
        <nav className="flex justify-between items-center max-w-screen-2xl mx-auto px-6 py-4">
          <div className="text-2xl font-semibold text-blue-600">Hotel Lens</div>
          <ul className="hidden md:flex gap-8 text-blue-600 font-medium">
            <li><Link href="#home" className="hover:text-blue-800 relative after:block after:h-0.5 after:w-0 after:bg-blue-700 after:transition-all hover:after:w-full">Home</Link></li>
            <li><Link href="#hotels" className="hover:text-blue-800 relative after:block after:h-0.5 after:w-0 after:bg-blue-700 after:transition-all hover:after:w-full">Hotels</Link></li>
            <li><Link href="#about" className="hover:text-blue-800 relative after:block after:h-0.5 after:w-0 after:bg-blue-700 after:transition-all hover:after:w-full">About</Link></li>
            <li><Link href="#contact" className="hover:text-blue-800 relative after:block after:h-0.5 after:w-0 after:bg-blue-700 after:transition-all hover:after:w-full">Contact</Link></li>
          </ul>
        </nav>
      </header>

      <main>
        {/* Hero + Search Form */}
        <section
          id="home"
          className="min-h-[calc(100vh-70px)] flex items-center justify-center text-center relative px-4 bg-gradient-to-br from-blue-600 to-gray-100"
        >
          <div className="max-w-2xl p-8 z-10">
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6 animate-fadeInUp">
              Find Your Perfect Stay
            </h1>
            <p className="text-lg md:text-xl text-white mb-8 animate-fadeInUp delay-200">
              Discover exceptional hotels worldwide…
            </p>

            <form
              onSubmit={handleSearch}
              className="grid gap-6 bg-white p-8 rounded-xl shadow-xl border border-gray-100 max-w-lg mx-auto animate-fadeInUp delay-400"
            >
              <input
                type="text"
                name="destination"
                placeholder="Enter city"
                required
                className="w-full p-3 border-2 border-gray-100 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
              />
              <input
                type="date"
                name="checkin"
                required
                className="w-full p-3 border-2 border-gray-100 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
              />
              <input
                type="date"
                name="checkout"
                required
                className="w-full p-3 border-2 border-gray-100 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
              />
              <select
                name="guests"
                required
                className="w-full p-3 border-2 border-gray-100 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition"
              >
                <option value="">Guests</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-md font-semibold uppercase tracking-wide hover:bg-blue-700 transform hover:-translate-y-0.5 shadow-md transition">
                  Search Available Hotels
                </button>
            </form>
          </div>
        </section>

        {/* Results */}
        <section id="hotels" className="py-12 px-6 max-w-6xl mx-auto">
          <h2 className="text-3xl font-light text-center mb-8">Available Hotels</h2>
          {loading && <p className="text-center">Loading...</p>}
          <div className="grid md:grid-cols-3 gap-8">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                <img
                  src={hotel.thumbnailUrl}
                  alt={hotel.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6 text-left">
                  <h3 className="text-xl font-semibold mb-2">{hotel.name}</h3>
                  <p className="text-gray-600">{hotel.address}</p>
                  <p className="mt-2">⭐ {hotel.rating}</p>
                  <p className="font-semibold mt-2 text-blue-600">${hotel.price}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {hotel.policyText ?? "No policy info"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center py-10 border-t border-gray-600 text-sm">
        © {new Date().getFullYear()} Hotel Lens. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
