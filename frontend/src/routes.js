import adminPanel from "./components/AdminPanel";
import getStats from "./components/GetStats";
import missingView from "./components/404";
import deleteMessage from "./components/DeleteMessage";
import receiveMessage from "./components/ReceiveMessage";
import sendMessage from "./components/SendMessage";

const routes = [
  {
    path: "/",
    component: adminPanel,
    redirect: "/send-message",
    name: "Admin Panel",
    meta: {
      description: "Navigation"
    },
    children: [
      {
        path: "/get-stats",
        component: getStats,
        name: "Queue Status",
        meta: {
          description: "View Queue Stats"
        }
      },
      {
        path: "/delete-message",
        component: deleteMessage,
        name: "Delete-Message",
        meta: {
          description: "Remove Message from Queue"
        }
      },
      {
        path: "/receive-message",
        component: receiveMessage,
        name: "Receive-Message",
        meta: {
          description: "Consume Messages from Queue"
        }
      },
      {
        path: "/send-message",
        component: sendMessage,
        name: "Send-Message",
        meta: {
          description: "Send Message to Queue"
        }
      }
    ]
  },
  {
    path: "*",
    component: missingView
  }
];

export default routes;
