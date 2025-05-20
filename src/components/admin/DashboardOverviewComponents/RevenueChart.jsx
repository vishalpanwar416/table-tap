import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ chartData, chartPeriod, isCollapsed, toggleCollapse, onChangePeriod }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800">Revenue Analysis</h3>
        <div className="flex items-center space-x-2">
          <select 
            className="text-sm border rounded p-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={chartPeriod}
            onChange={(e) => onChangePeriod(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button 
            onClick={toggleCollapse}
            className="p-1 rounded hover:bg-gray-100"
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;
