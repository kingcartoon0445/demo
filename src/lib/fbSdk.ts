// Facebook SDK type declarations
interface FacebookSDK {
    init: (config: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
    }) => void;
    getLoginStatus: (callback: (response: FacebookLoginStatus) => void) => void;
    login: (
        callback: (response: FacebookLoginResponse) => void,
        options: { scope: string }
    ) => void;
}

interface FacebookLoginStatus {
    status: string;
    authResponse?: {
        accessToken: string;
        userID: string;
    };
}

interface FacebookLoginResponse {
    status: string;
    authResponse?: {
        accessToken: string;
        userID: string;
    };
}

declare global {
    interface Window {
        FB: FacebookSDK;
        fbAsyncInit: () => void;
    }
}

export const initFacebookSdk = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Nếu đã tồn tại window.FB, thì không cần load lại
        if (window.FB) {
            try {
                window.FB.init({
                    appId: "1751811208512576",
                    cookie: true,
                    xfbml: true,
                    version: "v19.0", // Bạn có thể hạ xuống v17.0 nếu cần
                });
                resolve();
            } catch (err) {
                reject(err);
            }
            return;
        }

        // Inject Facebook SDK
        window.fbAsyncInit = () => {
            try {
                window.FB.init({
                    appId: "1751811208512576",
                    cookie: true,
                    xfbml: true,
                    version: "v18.0",
                });
                resolve();
            } catch (err) {
                reject(err);
            }
        };

        // Kiểm tra nếu script đã có thì không chèn thêm
        if (!document.getElementById("facebook-jssdk")) {
            const script = document.createElement("script");
            script.id = "facebook-jssdk";
            script.src = "https://connect.facebook.net/en_US/sdk.js";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
        }
    });
};

export const getFacebookLoginStatus = (): Promise<FacebookLoginStatus> => {
    return new Promise((resolve) => {
        window.FB.getLoginStatus((response: FacebookLoginStatus) => {
            resolve(response);
        });
    });
};

export const fbLogin = (scope: string): Promise<FacebookLoginResponse> => {
    return new Promise((resolve) => {
        window.FB.login(
            (response: FacebookLoginResponse) => {
                resolve(response);
            },
            { scope }
        );
    });
};
