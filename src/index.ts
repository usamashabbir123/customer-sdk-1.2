import { io, Socket } from 'socket.io-client';

let socket: Socket | undefined;
let wssServerIp: string;
let uriServerIp: string;
let diallingURI: string;
let sipExtension: string;
let extensionPassword: string;
let enable_sip_logs: boolean;
let enableLogs: boolean;
let IP: string;
let dialerURI: string;
let sipPassword: string;

export function widgetConfigs(
  ccmUrl: string,
  widgetIdentifier: string,
  callback: (data: any) => void
) {
  fetch(`${ccmUrl}/widget-configs/${widgetIdentifier}`)
    .then((response) => response.json())
    .then((data) => {
      callback(data);
      wssServerIp = data.webRtc.wssFs;
      uriServerIp = data.webRtc.uriFs;
      diallingURI = data.webRtc.diallingUri;
      sipExtension = data.webRtc.sipExtension;
      extensionPassword = data.webRtc.extensionPassword;
      enable_sip_logs = data.webRtc.enabledSipLogs;
      enableLogs = enable_sip_logs;
      IP = uriServerIp;
      dialerURI = "sip:" + diallingURI + "@" + uriServerIp;
      sipPassword = extensionPassword;
    });
}

export function getPreChatForm(
  formUrl: string,
  formId: string,
  callback: (data: any) => void
) {
  fetch(`${formUrl}/forms/${formId}`)
    .then((response) => response.json())
    .then((data) => {
      callback(data);
    });
}

export function formValidation(
  formUrl: string,
  callback: (data: any) => void
) {
  fetch(`${formUrl}/formValidation`)
    .then((response) => response.json())
    .then((data) => {
      callback(data);
    });
}

export function establishConnection(
  socket_url: string,
  serviceIdentifier: string,
  channelCustomerIdentifier: string,
  callback: (data: any) => void
) {
  try {
    if (socket !== undefined && socket.connected) {
      console.log("Resuming Existing Connection");
      eventListeners((data) => {
        callback(data);
      });
    } else {
      if (socket_url !== "") {
        console.log("Starting New Connection");
        const origin = new URL(socket_url).origin;
        const path = new URL(socket_url).pathname;
        socket = io(origin, {
          path: path == "/" ? "" : path + "/socket.io",
          auth: {
            serviceIdentifier: serviceIdentifier,
            channelCustomerIdentifier: channelCustomerIdentifier,
          },
        });
        eventListeners((data) => {
          callback(data);
        });
      }
    }
  } catch (error) {
    callback(error);
  }
}

export function eventListeners(callback: (data: any) => void) {
  socket?.on("connect", () => {
    if (socket?.id !== undefined) {
      console.log(`you are connected with socket:`, socket);
      const error = localStorage.getItem("widget-error");
      if (error) {
        callback({ type: "SOCKET_RECONNECTED", data: socket });
      } else {
        callback({ type: "SOCKET_CONNECTED", data: socket });
      }
    }
  });

  socket?.on("CHANNEL_SESSION_STARTED", (data) => {
    console.log(`Channel Session Started Data: `, data);
    callback({ type: "CHANNEL_SESSION_STARTED", data: data });
  });

  socket?.on("MESSAGE_RECEIVED", (message) => {
    console.log(`MESSAGE_RECEIVED received: `, message);
    callback({ type: "MESSAGE_RECEIVED", data: message });
  });

  socket?.on("disconnect", (reason) => {
    console.error(`Connection lost with the server: `, reason);
    callback({ type: "SOCKET_DISCONNECTED", data: reason });
  });

  socket?.on("connect_error", (error) => {
    console.log(
      `unable to establish connection with the server: `,
      error.message
    );
    localStorage.setItem("widget-error", "1");
    callback({ type: "CONNECT_ERROR", data: error });
  });

  socket?.on("CHAT_ENDED", (data) => {
    console.log(`CHAT_ENDED received: `, data);
    callback({ type: "CHAT_ENDED", data: data });
    socket?.disconnect();
  });

  socket?.on("ERRORS", (data) => {
    console.error(`ERRORS received: `, data);
    callback({ type: "ERRORS", data: data });
  });
}
