import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { store } from "./lib/store";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { Toaster } from "sonner";
import { ConfirmationDialog } from "./helpers/confirmAction.jsx";
import ErrorBoundary from "./components/custom/ErrorBoundary.jsx";

createRoot(document.getElementById("root")).render(
	<Provider store={store}>
		<ErrorBoundary>
			<BrowserRouter>
				<Toaster position='top-center' richColors />
				<App />
				<ConfirmationDialog />
			</BrowserRouter>
		</ErrorBoundary>
	</Provider>
);
