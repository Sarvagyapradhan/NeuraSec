import React from 'react';

const TestComponent = () => {
  return (
    <div className="p-8">
      <div className="bg-red-500 text-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">This is a Tailwind CSS Test Component</h2>
        <p className="text-lg">If you can see this with red background and white text, Tailwind CSS is working!</p>
        <button className="mt-4 bg-white text-red-500 px-4 py-2 rounded font-bold hover:bg-gray-100">
          Test Button
        </button>
      </div>
    </div>
  );
};

export default TestComponent; 