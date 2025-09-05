"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SimpleTestPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadData = () => {
    try {
      // Load transactions from localStorage
      const storedTransactions = localStorage.getItem('vanity_transactions')
      if (storedTransactions) {
        const parsed = JSON.parse(storedTransactions)
        setTransactions(parsed)
        console.log('Loaded transactions:', parsed)
      } else {
        setTransactions([])
      }

      // Load orders from localStorage
      const storedOrders = localStorage.getItem('salon_orders')
      if (storedOrders) {
        const parsed = JSON.parse(storedOrders)
        setOrders(parsed)
        console.log('Loaded orders:', parsed)
      } else {
        setOrders([])
      }

      // Load notifications from localStorage
      const storedNotifications = localStorage.getItem('salon_order_notifications')
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications)
        setNotifications(parsed)
        console.log('Loaded notifications:', parsed)
      } else {
        setNotifications([])
      }

      setError(null)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    }
  }

  useEffect(() => {
    loadData()
    // Refresh every 2 seconds
    const interval = setInterval(loadData, 2000)

    // Make loadData available globally for testing
    if (typeof window !== 'undefined') {
      (window as any).debugLoadData = loadData;
      (window as any).debugCheckTransactions = () => {
        const stored = localStorage.getItem('vanity_transactions');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('🔍 DEBUG: All transactions in localStorage:', parsed);
          console.log('🔍 DEBUG: CLIENT_PORTAL transactions:', parsed.filter((tx: any) => tx.source === 'CLIENT_PORTAL'));
          console.log('🔍 DEBUG: Today\'s transactions:', parsed.filter((tx: any) => {
            const txDate = new Date(tx.date);
            const today = new Date();
            return txDate.toDateString() === today.toDateString();
          }));
          return parsed;
        }
        return [];
      };

      (window as any).debugTestLocationFilter = () => {
        const stored = localStorage.getItem('vanity_transactions');
        if (stored) {
          const parsed = JSON.parse(stored);
          const clientPortalTxs = parsed.filter((tx: any) => tx.source === 'CLIENT_PORTAL');
          console.log('🧪 DEBUG: Testing location filter on CLIENT_PORTAL transactions:');
          clientPortalTxs.forEach((tx: any) => {
            console.log(`  Transaction ${tx.id}: location=${tx.location}, should always be shown regardless of filter`);
          });
          return clientPortalTxs;
        }
        return [];
      };

      (window as any).debugTestAccountingFilter = () => {
        const stored = localStorage.getItem('vanity_transactions');
        if (stored) {
          const parsed = JSON.parse(stored);
          const today = new Date();
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(today.getDate() - 30);

          console.log('🧪 DEBUG: Testing accounting page filters:');
          console.log('  Date range: 30 days ago to today');
          console.log('  30 days ago:', thirtyDaysAgo.toISOString());
          console.log('  Today:', today.toISOString());

          const clientPortalTxs = parsed.filter((tx: any) => tx.source === 'CLIENT_PORTAL');
          console.log('  CLIENT_PORTAL transactions found:', clientPortalTxs.length);

          clientPortalTxs.forEach((tx: any) => {
            const txDate = new Date(tx.date);
            const isInRange = txDate >= thirtyDaysAgo && txDate <= today;
            console.log(`    Transaction ${tx.id}:`);
            console.log(`      Date: ${txDate.toISOString()}`);
            console.log(`      In range: ${isInRange}`);
            console.log(`      Location: ${tx.location}`);
            console.log(`      Source: ${tx.source}`);
          });

          return clientPortalTxs;
        }
        return [];
      };

      (window as any).debugTestLocationFiltering = () => {
        const stored = localStorage.getItem('vanity_transactions');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('🧪 DEBUG: Testing location filtering logic:');

          // Test with different location filters
          const testFilters = ['all', 'loc1', 'loc2', 'online'];

          testFilters.forEach(filterLocation => {
            console.log(`\n  Testing filter location: "${filterLocation}"`);

            const filtered = parsed.filter((tx: any) => {
              // Simulate the filtering logic from transaction-provider.tsx
              if (filterLocation && filterLocation !== 'all' && tx.location !== filterLocation) {
                // Check if it's a CLIENT_PORTAL transaction
                const isClientPortalTransaction = tx.source === 'CLIENT_PORTAL' ||
                                                tx.source === 'client_portal';

                // Check if it's an online transaction
                const isOnlineTransaction = tx.location === 'online' ||
                                          tx.location === 'client_portal' ||
                                          tx.metadata?.isOnlineTransaction === true;

                // Check if it has no location
                const hasNoLocation = !tx.location || tx.location === null || tx.location === undefined;

                const isOnlineRelated = isClientPortalTransaction || isOnlineTransaction || hasNoLocation;

                if (isOnlineRelated) {
                  // Online transactions should ONLY appear when filtering by "online" location
                  if (filterLocation === 'online') {
                    console.log(`    ✅ KEEPING transaction ${tx.id} (${tx.source}) - online filter matches`);
                    return true; // Keep it
                  } else {
                    console.log(`    ❌ FILTERING OUT transaction ${tx.id} (${tx.source}) - online transaction excluded from physical location`);
                    return false; // Filter it out
                  }
                } else {
                  console.log(`    ❌ FILTERING OUT transaction ${tx.id} (${tx.source}) - location mismatch`);
                  return false; // Filter it out
                }
              }
              console.log(`    ✅ KEEPING transaction ${tx.id} (${tx.source}) - no location filter or matches`);
              return true; // Keep it
            });

            console.log(`    Result: ${filtered.length}/${parsed.length} transactions kept`);
            console.log(`    CLIENT_PORTAL transactions: ${filtered.filter((tx: any) => tx.source === 'CLIENT_PORTAL').length}`);
          });

          return parsed;
        }
        return [];
      };

      (window as any).migrateClientPortalTransactions = () => {
        const stored = localStorage.getItem('vanity_transactions');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('🔄 MIGRATION: Updating CLIENT_PORTAL transactions to use "online" location');

          let updatedCount = 0;
          const updated = parsed.map((tx: any) => {
            if (tx.source === 'CLIENT_PORTAL' && tx.location !== 'online') {
              console.log(`  Updating transaction ${tx.id}: ${tx.location} -> online`);
              updatedCount++;
              return {
                ...tx,
                location: 'online',
                metadata: {
                  ...tx.metadata,
                  isOnlineTransaction: true,
                  originalLocation: tx.location // Keep track of original location
                }
              };
            }
            return tx;
          });

          if (updatedCount > 0) {
            localStorage.setItem('vanity_transactions', JSON.stringify(updated));
            console.log(`✅ MIGRATION: Updated ${updatedCount} CLIENT_PORTAL transactions`);
            console.log('🔄 Please refresh the page to see the changes');
          } else {
            console.log('ℹ️ MIGRATION: No CLIENT_PORTAL transactions needed updating');
          }

          return { updated: updatedCount, total: parsed.length };
        }
        return { updated: 0, total: 0 };
      };

      (window as any).quickTestFiltering = () => {
        const stored = localStorage.getItem('vanity_transactions');
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('🧪 QUICK TEST: Current CLIENT_PORTAL transaction locations:');

          const clientPortalTxs = parsed.filter((tx: any) => tx.source === 'CLIENT_PORTAL');
          clientPortalTxs.forEach((tx: any) => {
            console.log(`  ${tx.id}: location="${tx.location}", source="${tx.source}"`);
          });

          console.log('\n🧪 QUICK TEST: Testing filter with location="loc1":');
          const filteredByLoc1 = parsed.filter((tx: any) => {
            if ('loc1' !== 'all' && tx.location !== 'loc1') {
              const isClientPortal = tx.source === 'CLIENT_PORTAL';
              const isOnline = tx.location === 'online' || tx.metadata?.isOnlineTransaction === true;
              const hasNoLocation = !tx.location;

              const isOnlineRelated = isClientPortal || isOnline || hasNoLocation;

              if (isOnlineRelated) {
                // Online transactions should ONLY appear when filtering by "online" location
                if ('loc1' === 'online') {
                  console.log(`    ✅ KEEPING ${tx.id} (${tx.source}) - online filter matches`);
                  return true;
                } else {
                  console.log(`    ❌ FILTERING OUT ${tx.id} (${tx.source}) - online transaction excluded from physical location`);
                  return false;
                }
              } else {
                console.log(`    ❌ FILTERING OUT ${tx.id} (${tx.source}) - location mismatch`);
                return false;
              }
            }
            console.log(`    ✅ KEEPING ${tx.id} (${tx.source}) - location matches`);
            return true;
          });

          console.log(`\nResult: ${filteredByLoc1.length}/${parsed.length} transactions kept`);
          console.log(`CLIENT_PORTAL kept: ${filteredByLoc1.filter((tx: any) => tx.source === 'CLIENT_PORTAL').length}`);

          return { total: parsed.length, filtered: filteredByLoc1.length, clientPortal: clientPortalTxs.length };
        }
        return { total: 0, filtered: 0, clientPortal: 0 };
      };

      // Create a test CLIENT_PORTAL transaction
      (window as any).createTestClientPortalTransaction = () => {
        console.log('🛒 Creating test CLIENT_PORTAL transaction...');

        const testTransaction = {
          id: `${Date.now() % 1000000}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`,
          date: new Date().toISOString(),
          clientId: "test-client-123",
          clientName: "Test Customer",
          type: "PRODUCT_SALE",
          category: "Online Product Sale",
          description: "Client Portal Order - 1 item",
          amount: 99.99,
          paymentMethod: "CREDIT_CARD",
          status: "COMPLETED",
          location: "online",
          source: "CLIENT_PORTAL",
          reference: {
            type: "client_portal_order",
            id: `order-${Date.now()}`
          },
          metadata: {
            orderData: {
              id: `order-${Date.now()}`,
              clientId: "test-client-123",
              items: [
                {
                  product: {
                    id: "test-product-1",
                    name: "Test Product",
                    price: 99.99
                  },
                  quantity: 1
                }
              ],
              subtotal: 99.99,
              total: 99.99,
              paymentMethod: "card",
              status: "completed",
              createdAt: new Date().toISOString()
            },
            itemCount: 1,
            isOnlineTransaction: true
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Get existing transactions
        const stored = localStorage.getItem('vanity_transactions');
        const existing = stored ? JSON.parse(stored) : [];

        // Add new transaction
        existing.push(testTransaction);

        // Save back to localStorage
        localStorage.setItem('vanity_transactions', JSON.stringify(existing));

        console.log('✅ Test CLIENT_PORTAL transaction created:', testTransaction);
        console.log('🔄 Refresh the page or accounting page to see the transaction');

        return testTransaction;
      };

      // Debug function to check client portal order flow
      (window as any).debugClientPortalOrderFlow = () => {
        console.log('🔍 DEBUG: Client Portal Order Flow Check')

        const clientId = localStorage.getItem("client_id") || localStorage.getItem("client_email") || "guest"
        console.log('Client ID from localStorage:', {
          client_id: localStorage.getItem("client_id"),
          client_email: localStorage.getItem("client_email"),
          client_auth_token: localStorage.getItem("client_auth_token"),
          finalClientId: clientId
        })

        // Check all orders
        console.log('All orders:', orders.length)
        orders.forEach(order => {
          console.log(`Order ${order.id}:`, {
            clientId: order.clientId,
            clientName: order.clientName,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt
          })
        })

        // Check client-specific orders
        const clientOrders = orders.filter(order => {
          const exactMatch = order.clientId === clientId
          const nameMatch = order.clientName?.toLowerCase().includes(clientId.toLowerCase())
          console.log(`Checking order ${order.id}:`, {
            orderClientId: order.clientId,
            searchClientId: clientId,
            exactMatch,
            nameMatch,
            finalMatch: exactMatch || nameMatch
          })
          return exactMatch || nameMatch
        })
        console.log(`Orders for client ${clientId}:`, clientOrders.length)

        // Check transactions too
        console.log('All transactions:', transactions.length)
        const clientTransactions = transactions.filter(t =>
          t.clientId === clientId ||
          t.clientName?.toLowerCase().includes(clientId.toLowerCase())
        )
        console.log(`Transactions for client ${clientId}:`, clientTransactions.length)

        return {
          clientId,
          totalOrders: orders.length,
          clientOrders: clientOrders.length,
          totalTransactions: transactions.length,
          clientTransactions: clientTransactions.length
        }
      }

      // Function to simulate client login for testing
      (window as any).simulateClientLogin = (email = "test@example.com", clientId = "client123") => {
        console.log('🔐 SIMULATING CLIENT LOGIN:', { email, clientId })

        localStorage.setItem("client_auth_token", "sample_token")
        localStorage.setItem("client_email", email)
        localStorage.setItem("client_id", clientId)

        // Dispatch auth change event
        window.dispatchEvent(new CustomEvent('client-auth-changed', {
          detail: { isLoggedIn: true }
        }))

        console.log('✅ Client login simulated. Current auth state:', {
          token: localStorage.getItem("client_auth_token"),
          email: localStorage.getItem("client_email"),
          clientId: localStorage.getItem("client_id")
        })

        return { email, clientId }
      }

      // Function to clear client auth for testing
      (window as any).clearClientAuth = () => {
        console.log('🔓 CLEARING CLIENT AUTH')

        localStorage.removeItem("client_auth_token")
        localStorage.removeItem("client_email")
        localStorage.removeItem("client_id")

        // Dispatch auth change event
        window.dispatchEvent(new CustomEvent('client-auth-changed', {
          detail: { isLoggedIn: false }
        }))

        console.log('✅ Client auth cleared')
      }
    }

    return () => clearInterval(interval)
  }, [])

  const clientPortalTransactions = transactions.filter(tx => tx.source === 'CLIENT_PORTAL')
  const recentNotifications = notifications.slice(-5).reverse()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Simple Test Page</h1>
        <div className="flex gap-2">
          <Button onClick={loadData}>Refresh Data</Button>
        </div>
      </div>

      {/* Debug Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                // Simulate client login
                (window as any).simulateClientLogin?.()
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Simulate Client Login
            </Button>

            <Button
              onClick={() => {
                // Debug client portal order flow
                const result = (window as any).debugClientPortalOrderFlow?.()
                console.log('Debug result:', result)
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Debug Order Flow
            </Button>

            <Button
              onClick={() => {
                // Clear client auth
                (window as any).clearClientAuth?.()
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear Client Auth
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-semibold">{transactions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Client Portal:</span>
                <span className="font-semibold">{clientPortalTransactions.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-semibold">{orders.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="font-semibold">{notifications.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Client Portal Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Client Portal Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {clientPortalTransactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No client portal transactions found.
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {clientPortalTransactions.slice(-5).reverse().map((transaction, index) => (
                <div key={transaction.id || index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{transaction.id}</h3>
                      <p className="text-xs text-gray-600">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.clientName} • ${transaction.amount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'No date'}
                      </p>
                      <p className="text-xs font-medium">{transaction.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No orders found.
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {orders.slice(-5).reverse().map((order, index) => (
                <div key={order.id || index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{order.id}</h3>
                      <p className="text-xs text-gray-600">{order.clientName}</p>
                      <p className="text-xs text-gray-500">
                        {order.items?.length || 0} item(s) • ${order.total}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'No date'}
                      </p>
                      <p className="text-xs font-medium">{order.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No notifications found.
            </p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentNotifications.map((notification, index) => (
                <div key={notification.id || index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-sm">{notification.type}</h3>
                      <p className="text-xs text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-500">
                        {notification.clientName} • Order: {notification.orderId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {notification.timestamp ? new Date(notification.timestamp).toLocaleDateString() : 'No date'}
                      </p>
                      <p className="text-xs font-medium">{notification.read ? 'Read' : 'Unread'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
