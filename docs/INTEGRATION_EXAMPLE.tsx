/**
 * Example: How to integrate ChatAssistantV2 into PageCustomer.tsx
 * 
 * This file shows the minimal changes needed to add the RAG-powered chatbot
 * to the customer page.
 */

// ========== STEP 1: Add Imports ==========
import ChatAssistantV2 from "./ChatAssistantV2";
import "./ChatAssistantV2.css";

// If using Keycloak for authentication:
import { useKeycloak } from "@react-keycloak/web";

// ========== STEP 2: Inside Component Function ==========
const PageCustomer: React.FC = () => {
  const { keycloak } = useKeycloak();
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // Determine if current user is a customer
  const isCustomer = keycloak?.tokenParsed?.realm_access?.roles?.includes('customer');

  // Extract user information from Keycloak token
  const userContext = {
    role: 'customer',
    userId: keycloak?.tokenParsed?.sub || '',
    userName: keycloak?.tokenParsed?.preferred_username || 
              keycloak?.tokenParsed?.name || 
              'Customer'
  };

  // ========== STEP 3: Add Component to JSX (at the end, before closing tag) ==========
  return (
    <div className="page-customer">
      {/* ... existing page content ... */}
      
      {/* User info card */}
      <div className="user-info">
        {/* ... */}
      </div>

      {/* Order history */}
      {showOrderHistory && (
        <div className="order-history">
          {/* ... */}
        </div>
      )}

      {/* ====== CHATBOT INTEGRATION ====== */}
      {isCustomer && (
        <ChatAssistantV2 
          onToggleOrderHistory={() => setShowOrderHistory(true)}
          userContext={userContext}
        />
      )}
      {/* ================================= */}
    </div>
  );
};

export default PageCustomer;

// ========== ALTERNATIVE: Without Keycloak ==========
/*
// If not using Keycloak, you can pass static context:
const userContext = {
  role: 'customer',
  userId: 'customer-123', // From your auth system
  userName: 'João Silva'  // From user profile
};

<ChatAssistantV2 
  onToggleOrderHistory={() => setShowOrderHistory(true)}
  userContext={userContext}
/>
*/

// ========== ALTERNATIVE: Minimal Integration (No Context) ==========
/*
// Simplest possible integration (no user context):
<ChatAssistantV2 
  onToggleOrderHistory={() => setShowOrderHistory(true)}
/>
*/

// ========== CALLBACK EXPLANATION ==========
/*
The onToggleOrderHistory callback is triggered when:
1. User asks "ver histórico" or "meus pedidos" in the chat
2. User clicks the "📋 Histórico" quick action button

This allows the chatbot to control the page state and show the order history
panel without requiring the user to manually click a button.

Example flow:
  User: "Quero ver meu histórico de pedidos"
  Bot: "📋 Clique no botão "Ver Histórico de Encomendas"..."
       → Automatically calls onToggleOrderHistory()
       → setShowOrderHistory(true) is executed
       → Order history panel appears
*/

// ========== STYLING NOTES ==========
/*
The chatbot is styled to float in the bottom-right corner and won't interfere
with your existing layout. Make sure:

1. No z-index conflicts:
   - FAB button has z-index: 1000
   - Chat window has z-index: 999
   - Ensure your navbar/modals don't exceed these values

2. Mobile responsiveness:
   - On mobile (<768px), chat window takes ~90% of screen
   - On very small screens (<480px), chat is fullscreen

3. TailwindCSS:
   - If you use TailwindCSS elsewhere, it won't conflict
   - Config has preflight: false to preserve Bootstrap styles

4. Dark mode:
   - Automatically detects user's preference
   - Works with @media (prefers-color-scheme: dark)
*/

// ========== TESTING CHECKLIST ==========
/*
After integration, test:

✅ Button appears in bottom-right corner (blue, circular, chat icon)
✅ Clicking button opens chat window
✅ Welcome message appears automatically
✅ Can type and send messages
✅ Responses are relevant (RAG context working)
✅ Quick actions work ("📋 Histórico" button)
✅ Closing chat works (X button)
✅ Responsive on mobile (check at 375px width)
✅ Dark mode works (if enabled in OS)
✅ No console errors
✅ Doesn't interfere with existing page elements
*/

// ========== TROUBLESHOOTING ==========
/*
Issue: "Cannot find module '@assistant-ui/react'"
Fix: Run `npm install @assistant-ui/react @assistant-ui/react-ai-sdk ai @ai-sdk/openai`

Issue: Chat button doesn't appear
Fix: Check if isCustomer === true (role check)

Issue: No responses from chatbot
Fix: Verify backend is running and /api/chat endpoint is accessible

Issue: Styling looks wrong
Fix: Ensure ChatAssistantV2.css is imported

Issue: TypeScript errors
Fix: npm install --save-dev @types/node (if missing type definitions)

Issue: Chat window overlaps navbar
Fix: Adjust z-index in your navbar CSS (should be < 999)

Issue: Doesn't work on mobile
Fix: Check responsive CSS breakpoints in ChatAssistantV2.css

Issue: Backend errors
Fix: Verify ChatController.java is compiled and deployed

Issue: CORS errors
Fix: Add @CrossOrigin(origins = "*") to ChatController.java (already added)
*/

// ========== FUTURE ENHANCEMENTS ==========
/*
Easy improvements to add later:

1. **Unread message indicator**:
   - Show red dot when bot responds while chat is closed

2. **Sound notifications**:
   - Play subtle sound when bot responds

3. **Typing indicator**:
   - Show "..." when waiting for backend response

4. **Message reactions**:
   - Let users rate responses (👍 👎)

5. **Suggested questions**:
   - Show quick reply buttons for common queries

6. **File attachments**:
   - Allow uploading POD images for verification

7. **Multi-language**:
   - Detect user language and respond accordingly

8. **Voice input**:
   - Web Speech API for voice messages

9. **Chat history persistence**:
   - Save to localStorage for returning users

10. **Analytics events**:
    - Track chat opens, message counts, popular queries
*/
