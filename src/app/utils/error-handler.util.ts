export class ErrorHandler {
    static getErrorMessage(err: any): string {
        // No Internet (Client Offline)
        if (!navigator.onLine) {
            return "No internet connection. Please check your network.";
        }

        // Backend Down (Status 0 [reachable but failed], 404, or 500)
        if (err.status === 0 || err.status === 404 || err.status === 500) {
            return "We are having trouble reaching the server.";
        }

        // Backend Down (Status 404 or 500)
        if (err.status === 404 || err.status === 500) {
            return "We are having trouble reaching the server.";
        }

        // DB Timeout (Status 408 or 'timeout' in string)
        if (err.status === 408 || (err.statusText && err.statusText.toLowerCase().includes('timeout'))) {
            return "System is busy. Your request is being processed, please wait.";
        }

        // Default or Server Message
        return err.error?.message || "An unexpected error occurred.";
    }
}
