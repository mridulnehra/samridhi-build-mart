import { Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Production from './pages/Production';
import Cashbook from './pages/Cashbook';
import Sales from './pages/Sales';
import NewSale from './pages/NewSale';
import Inventory from './pages/Inventory';
import Blocks from './pages/Blocks';
import Materials from './pages/Materials';
import Members from './pages/Members';
import Transport from './pages/Transport';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import QuickAdd from './pages/QuickAdd';

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/production" element={<Production />} />
            <Route path="/cashbook" element={<Cashbook />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales/new" element={<NewSale />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/inventory/blocks" element={<Blocks />} />
            <Route path="/inventory/materials" element={<Materials />} />
            <Route path="/members" element={<Members />} />
            <Route path="/transport" element={<Transport />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/quick-add" element={<QuickAdd />} />
        </Routes>
    );
}
