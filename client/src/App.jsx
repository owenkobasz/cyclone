import './index.css';
import ButtonGradient from './assets/svg/ButtonGradient';
import Header from './components/Header';
import Home from './components/Home';
import About from './components/About';
import GenerateRoutes from './components/GenerateRoutes';
import ErrorBoundary from './components/ErrorBoundary';

// TODO: Improve scaling on the nav bar
// TODO: add logo to navbar
// TODO: add logged in/logged out functionality
// TODO: make it so the page you're currently on isn't displayed

// function AppLayout() {
//   const location = useLocation();
//   const isHomePage = location.pathname === '/';
//   const isLogin = location.pathname ==='/login';

const App = () => {
  return (
    // <div className="min-h-screen">
    //   {!isHomePage && (
    //     <header className="bg-blue-500 text-white p-4 shadow-md">
    //       <div className="w-full flex justify-between items-center">
    //         <h1 className="text-2xl font-bold">Cyclone</h1>
    //         <nav className="flex space-x-6">
    //             {/*TODO: Add login/logout button, profile button when logged in */}
    //           <Link to="/" className="px-4 py-2 text-xl font-bold text-white !text-white bg-blue-500 border border-2 border-white hover:bg-blue-600 hover:underline rounded transition-colors">Home</Link>
    //           <Link to="/routes" className="px-4 py-2 text-xl font-bold text-white !text-white bg-blue-500 border border-2 border-white hover:bg-blue-600 hover:underline rounded transition-colors">Routes</Link>
    //           <Link to="/login" className="px-4 py-2 text-xl font-bold text-white !text-white bg-blue-500 border border-2 border-white hover:bg-blue-600 hover:underline rounded transition-colors">Login</Link>
    //         </nav>
    //       </div>
    //     </header>
    //   )}
    //   <main className={(!isHomePage && !isLogin) ? "px-4 py-6" : ""}>
    //     <Routes>
    //       <Route path="/" element={<HomePage />} />
    //       <Route path="/routes" element={<RouteDisplay />} />
    //       <Route path="/login" element={<Login />} />
    //     </Routes>
    //   </main>
    // </div>
    <ErrorBoundary>
      <div className="pt-[4.75rem] lg:pt-[6.25rem] overflow-hidden">
        <Header/>
        <Home />
        <About />
        <GenerateRoutes />
      </div>
      <ButtonGradient />
    </ErrorBoundary>
  );
}

export default App;


