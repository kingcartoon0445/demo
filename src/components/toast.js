import toast from "react-hot-toast"

export const ToastPromise = (request) => {
    toast.promise(request(), { loading: "Vui lòng chờ..." }, {
        success: {
            style: {
                display: "none"
            }
        },
        error: {
            style: {
                display: "none"
            }
        }

    })
}