import { io, Socket } from "socket.io-client";

class SDK {
  private static socket: Socket | undefined;

  private static wssServerIp: string;
  private static uriServerIp: string;
  private static diallingURI: string;
  private static sipExtension: string;
  private static extensionPassword: string;
  private static enable_sip_logs: boolean;
  private static enableLogs: boolean;
  private static IP: string;
  private static dialerURI: string;
  private static sipPassword: string;

  public static widgetConfigs(
    ccmUrl: string,
    widgetIdentifier: string,
    callback: (data: any) => void
  ) {
    fetch(`${ccmUrl}/widget-configs/${widgetIdentifier}`)
      .then((response) => response.json())
      .then((data) => {
        callback(data);
        this.wssServerIp = data.webRtc.wssFs;
        this.uriServerIp = data.webRtc.uriFs;
        this.diallingURI = data.webRtc.diallingUri;
        this.sipExtension = data.webRtc.sipExtension;
        this.extensionPassword = data.webRtc.extensionPassword;
        this.enable_sip_logs = data.webRtc.enabledSipLogs;
        this.enableLogs = this.enable_sip_logs;
        this.IP = this.uriServerIp;
        this.dialerURI = "sip:" + this.diallingURI + "@" + this.uriServerIp;
        this.sipPassword = this.extensionPassword;
      });
  }

  /**
   * Get Pre Chat Form
   * @param formUrl
   * @param formId
   * @param callback
   */
  public static getPreChatForm(
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

  /**
   * Form Validation
   * @param formUrl
   * @param callback
   */
  public static formValidation(formUrl: string, callback: (data: any) => void) {
    fetch(`${formUrl}/formValidation`)
      .then((response) => response.json())
      .then((data) => {
        callback(data);
      });
  }

  /**
   * Function to Establish Connection
   * Two Parameters
   * 1- Customer Data
   * 2- Call Function of socketEventListeners()
   * @param serviceIdentifier
   * @param channelCustomerIdentifier
   * @param callback
   */
  public static establishConnection(
    socket_url: string,
    serviceIdentifier: string,
    channelCustomerIdentifier: string,
    callback: (data: any) => void
  ) {
    try {
      if (this.socket !== undefined && this.socket.connected) {
        console.log("Resuming Existing Connection");
        this.eventListeners((data) => {
          callback(data);
        });
      } else {
        if (socket_url !== "") {
          console.log("Starting New Connection");
          const origin = new URL(socket_url).origin;
          const path = new URL(socket_url).pathname;
          this.socket = io(origin, {
            path: path == "/" ? "" : path + "/socket.io",
            auth: {
              serviceIdentifier: serviceIdentifier,
              channelCustomerIdentifier: channelCustomerIdentifier,
            },
          });
          this.eventListeners((data) => {
            callback(data);
          });
        }
      }
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Socket EventListener Function
   * 1- Socket Connection Event
   * 2- Socket Discount Event
   * 3- Socket Connection Error Event
   * 4- Socket Message Arrived Event
   * 5- Socket End Conversation Event
   * 6- Socket Error
   * 7- Channel Session Started Event
   * @param callback
   */
  public static eventListeners(callback: (data: any) => void) {
    this.socket?.on("connect", () => {
      if (this.socket?.id !== undefined) {
        console.log(`you are connected with socket:`, this.socket);
        const error = localStorage.getItem("widget-error");
        if (error) {
          callback({ type: "SOCKET_RECONNECTED", data: this.socket });
        } else {
          callback({ type: "SOCKET_CONNECTED", data: this.socket });
        }
      }
    });

    this.socket?.on("CHANNEL_SESSION_STARTED", (data) => {
      console.log(`Channel Session Started Data: `, data);
      callback({ type: "CHANNEL_SESSION_STARTED", data: data });
    });

    this.socket?.on("MESSAGE_RECEIVED", (message) => {
      console.log(`MESSAGE_RECEIVED received: `, message);
      callback({ type: "MESSAGE_RECEIVED", data: message });
    });

    this.socket?.on("disconnect", (reason) => {
      console.error(`Connection lost with the server: `, reason);
      callback({ type: "SOCKET_DISCONNECTED", data: reason });
    });

    this.socket?.on("connect_error", (error) => {
      console.log(
        `unable to establish connection with the server: `,
        error.message
      );
      localStorage.setItem("widget-error", "1");
      callback({ type: "CONNECT_ERROR", data: error });
    });

    this.socket?.on("CHAT_ENDED", (data) => {
      console.log(`CHAT_ENDED received: `, data);
      callback({ type: "CHAT_ENDED", data: data });
      this.socket?.disconnect();
    });

    this.socket?.on("ERRORS", (data) => {
      console.error(`ERRORS received: `, data);
      callback({ type: "ERRORS", data: data });
    });
  }
}
