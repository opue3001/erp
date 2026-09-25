import { RestEndpoint, ApiResponse } from '../types/erp';
import { frappeDB } from './db';
import { frappeAuth } from './auth';

export const STANDARD_ENDPOINTS: RestEndpoint[] = [
  {
    id: 'get_resource_list',
    method: 'GET',
    path: '/api/v1/resource/Customer',
    category: 'Resource',
    title: 'List Documents',
    description: 'Fetch filtered and paginated records for any DocType with selective projection.',
    defaultParams: {
      fields: '["customer_name","email_id","credit_limit","status"]',
      filters: '{"status":"Active"}',
      limit: '10',
      order_by: 'creation desc',
    },
  },
  {
    id: 'get_resource_single',
    method: 'GET',
    path: '/api/v1/resource/Sales Order/SO-2026-001',
    category: 'Resource',
    title: 'Get Single Document',
    description: 'Fetch complete document object by primary key name with child tables and status.',
  },
  {
    id: 'post_resource_create',
    method: 'POST',
    path: '/api/v1/resource/Item',
    category: 'Resource',
    title: 'Insert Document',
    description: 'Create a new document in the database abstraction layer with schema validation.',
    defaultPayload: {
      item_code: 'SENSOR-IR-940',
      item_name: 'Infrared Spectral Sensor 940nm Industrial Grade',
      item_group: 'Components',
      stock_uom: 'Nos',
      standard_rate: 185.0,
      valuation_rate: 110.0,
      total_qty: 60,
      reorder_level: 15,
    },
  },
  {
    id: 'put_resource_update',
    method: 'PUT',
    path: '/api/v1/resource/Customer/CUST-0001',
    category: 'Resource',
    title: 'Update Document',
    description: 'Update field values of an existing draft document.',
    defaultPayload: {
      credit_limit: 175000,
      phone: '+1 (415) 890-9999',
    },
  },
  {
    id: 'delete_resource',
    method: 'DELETE',
    path: '/api/v1/resource/Item/ITEM-0004',
    category: 'Resource',
    title: 'Delete Document',
    description: 'Delete an un-submitted document from the database.',
  },
  {
    id: 'method_stock_balance',
    method: 'GET',
    path: '/api/v1/method/erp.stock.get_balance',
    category: 'Method',
    title: 'Stock Balance Method',
    description: 'RPC method returning real-time warehouse balance and inventory valuation.',
    defaultParams: {
      item_code: 'NX-OPTIC-400',
    },
  },
  {
    id: 'method_sales_invoice',
    method: 'POST',
    path: '/api/v1/method/erp.sales.create_invoice_from_order',
    category: 'Method',
    title: 'Create Invoice from Order',
    description: 'Whitelisted server method that converts an existing Sales Order into a Sales Invoice.',
    defaultPayload: {
      sales_order: 'SO-2026-001',
    },
  },
  {
    id: 'method_auth_login',
    method: 'POST',
    path: '/api/v1/method/erp.auth.login',
    category: 'Auth',
    title: 'User Authentication',
    description: 'Exchanges user credentials for an active session bearer token and user role payload.',
    defaultPayload: {
      email: 'alex.vance@aether-erp.internal',
    },
  },
];

export async function executeRestApi(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  params?: Record<string, string>,
  payload?: any
): Promise<ApiResponse> {
  const start = performance.now();
  await new Promise((r) => setTimeout(r, 65)); // realistic micro-network latency

  const currentUser = frappeAuth.getCurrentUser();
  const cleanPath = path.split('?')[0].trim();

  // Auth endpoint
  if (cleanPath === '/api/v1/method/erp.auth.login' && method === 'POST') {
    const email = payload?.email || '';
    const res = frappeAuth.loginWithCredentials(email);
    const elapsed = Math.round(performance.now() - start);

    if (res.success) {
      return {
        status: 200,
        statusText: 'OK',
        elapsedMs: elapsed,
        timestamp: new Date().toISOString(),
        data: {
          message: 'Logged In',
          user: res.user,
          token: res.token,
          expires_in: 86400,
        },
      };
    } else {
      return {
        status: 401,
        statusText: 'Unauthorized',
        elapsedMs: elapsed,
        timestamp: new Date().toISOString(),
        data: { error: 'Authentication failed', message: res.error },
      };
    }
  }

  // Stock RPC method
  if (cleanPath === '/api/v1/method/erp.stock.get_balance' && method === 'GET') {
    const itemCode = params?.item_code;
    const items = frappeDB.get_list('Item', itemCode ? { filters: { item_code: itemCode } } : undefined);
    const elapsed = Math.round(performance.now() - start);

    return {
      status: 200,
      statusText: 'OK',
      elapsedMs: elapsed,
      timestamp: new Date().toISOString(),
      data: {
        message: 'Stock Balance Retrieved',
        items: items.map((i) => ({
          item_code: i.item_code,
          item_name: i.item_name,
          current_qty: i.total_qty,
          uom: i.stock_uom,
          valuation_rate: i.valuation_rate,
          total_inventory_value: Math.round((Number(i.total_qty) || 0) * (Number(i.valuation_rate) || 0) * 100) / 100,
          status: i.status,
        })),
      },
    };
  }

  // Convert Sales Order to Invoice
  if (cleanPath === '/api/v1/method/erp.sales.create_invoice_from_order' && method === 'POST') {
    const orderName = payload?.sales_order;
    const order = frappeDB.get_doc('Sales Order', orderName);
    const elapsed = Math.round(performance.now() - start);

    if (!order) {
      return {
        status: 404,
        statusText: 'Not Found',
        elapsedMs: elapsed,
        timestamp: new Date().toISOString(),
        data: { error: `Sales Order "${orderName}" not found.` },
      };
    }

    const invoice = frappeDB.insert(
      {
        doctype: 'Sales Invoice',
        customer: order.customer,
        posting_date: new Date().toISOString().substring(0, 10),
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10),
        sales_order: order.name,
        grand_total: order.grand_total,
        outstanding_amount: order.grand_total,
        payment_status: 'Unpaid',
      },
      currentUser.full_name
    );

    return {
      status: 201,
      statusText: 'Created',
      elapsedMs: elapsed,
      timestamp: new Date().toISOString(),
      data: {
        message: `Sales Invoice ${invoice.name} generated from ${order.name}`,
        invoice,
      },
    };
  }

  // Resource Router: /api/v1/resource/:doctype(/:name)
  const resourceMatch = cleanPath.match(/^\/api\/v1\/resource\/([^/]+)(?:\/(.+))?$/);
  if (resourceMatch) {
    const rawDocType = decodeURIComponent(resourceMatch[1]);
    const docName = resourceMatch[2] ? decodeURIComponent(resourceMatch[2]) : null;

    // Check if DocType exists
    const meta = frappeDB.get_doctype(rawDocType);
    if (!meta) {
      const elapsed = Math.round(performance.now() - start);
      return {
        status: 404,
        statusText: 'Not Found',
        elapsedMs: elapsed,
        timestamp: new Date().toISOString(),
        data: { error: `DocType "${rawDocType}" does not exist in schema.` },
      };
    }

    // LIST VIEW: GET /api/v1/resource/:doctype
    if (method === 'GET' && !docName) {
      if (!frappeAuth.hasPermission(rawDocType, 'read', currentUser)) {
        const elapsed = Math.round(performance.now() - start);
        return {
          status: 403,
          statusText: 'Forbidden',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { error: `Permission Denied: User role ${currentUser.role} cannot READ ${rawDocType}` },
        };
      }

      let parsedFilters: any = undefined;
      let parsedFields: any = undefined;

      try {
        if (params?.filters) parsedFilters = JSON.parse(params.filters);
        if (params?.fields) parsedFields = JSON.parse(params.fields);
      } catch {
        // use as string or ignore
      }

      const limit = params?.limit ? parseInt(params.limit, 10) : 20;
      const order_by = params?.order_by || 'creation desc';

      const data = frappeDB.get_list(rawDocType, {
        filters: parsedFilters,
        fields: parsedFields,
        order_by,
        limit,
      });

      const elapsed = Math.round(performance.now() - start);
      return {
        status: 200,
        statusText: 'OK',
        elapsedMs: elapsed,
        timestamp: new Date().toISOString(),
        data: {
          data,
          total: data.length,
          page_length: limit,
        },
      };
    }

    // SINGLE DOC: GET /api/v1/resource/:doctype/:name
    if (method === 'GET' && docName) {
      if (!frappeAuth.hasPermission(rawDocType, 'read', currentUser)) {
        const elapsed = Math.round(performance.now() - start);
        return {
          status: 403,
          statusText: 'Forbidden',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { error: `Permission Denied: Role ${currentUser.role} cannot READ ${rawDocType}` },
        };
      }

      const doc = frappeDB.get_doc(rawDocType, docName);
      const elapsed = Math.round(performance.now() - start);
      if (!doc) {
        return {
          status: 404,
          statusText: 'Not Found',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { error: `Document ${rawDocType} ${docName} not found` },
        };
      }

      return {
        status: 200,
        statusText: 'OK',
        elapsedMs: elapsed,
        timestamp: new Date().toISOString(),
        data: { data: doc },
      };
    }

    // INSERT: POST /api/v1/resource/:doctype
    if (method === 'POST' && !docName) {
      if (!frappeAuth.hasPermission(rawDocType, 'create', currentUser)) {
        const elapsed = Math.round(performance.now() - start);
        return {
          status: 403,
          statusText: 'Forbidden',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { error: `Permission Denied: Role ${currentUser.role} cannot CREATE ${rawDocType}` },
        };
      }

      try {
        const newDoc = frappeDB.insert(
          {
            ...payload,
            doctype: rawDocType,
          },
          currentUser.full_name
        );
        const elapsed = Math.round(performance.now() - start);
        return {
          status: 201,
          statusText: 'Created',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { data: newDoc },
        };
      } catch (err: any) {
        const elapsed = Math.round(performance.now() - start);
        return {
          status: 400,
          statusText: 'Bad Request',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { error: err.message || 'Validation error' },
        };
      }
    }

    // UPDATE: PUT /api/v1/resource/:doctype/:name
    if (method === 'PUT' && docName) {
      if (!frappeAuth.hasPermission(rawDocType, 'write', currentUser)) {
        const elapsed = Math.round(performance.now() - start);
        return {
          status: 403,
          statusText: 'Forbidden',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { error: `Permission Denied: Role ${currentUser.role} cannot WRITE ${rawDocType}` },
        };
      }

      try {
        const existing = frappeDB.get_doc(rawDocType, docName);
        if (!existing) {
          const elapsed = Math.round(performance.now() - start);
          return {
            status: 404,
            statusText: 'Not Found',
            elapsedMs: elapsed,
            timestamp: new Date().toISOString(),
            data: { error: `Document ${rawDocType} ${docName} not found` },
          };
        }

        const updated = frappeDB.save(
          {
            ...existing,
            ...payload,
            name: docName,
            doctype: rawDocType,
          },
          currentUser.full_name
        );

        const elapsed = Math.round(performance.now() - start);
        return {
          status: 200,
          statusText: 'OK',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { data: updated },
        };
      } catch (err: any) {
        const elapsed = Math.round(performance.now() - start);
        return {
          status: 400,
          statusText: 'Bad Request',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { error: err.message },
        };
      }
    }

    // DELETE: DELETE /api/v1/resource/:doctype/:name
    if (method === 'DELETE' && docName) {
      if (!frappeAuth.hasPermission(rawDocType, 'delete', currentUser)) {
        const elapsed = Math.round(performance.now() - start);
        return {
          status: 403,
          statusText: 'Forbidden',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { error: `Permission Denied: Role ${currentUser.role} cannot DELETE ${rawDocType}` },
        };
      }

      try {
        const success = frappeDB.delete_doc(rawDocType, docName);
        const elapsed = Math.round(performance.now() - start);
        if (!success) {
          return {
            status: 404,
            statusText: 'Not Found',
            elapsedMs: elapsed,
            timestamp: new Date().toISOString(),
            data: { error: `Document ${rawDocType} ${docName} not found.` },
          };
        }
        return {
          status: 200,
          statusText: 'OK',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { message: `Document ${docName} deleted successfully` },
        };
      } catch (err: any) {
        const elapsed = Math.round(performance.now() - start);
        return {
          status: 400,
          statusText: 'Bad Request',
          elapsedMs: elapsed,
          timestamp: new Date().toISOString(),
          data: { error: err.message },
        };
      }
    }
  }

  // Fallback 404
  const elapsed = Math.round(performance.now() - start);
  return {
    status: 404,
    statusText: 'Not Found',
    elapsedMs: elapsed,
    timestamp: new Date().toISOString(),
    data: { error: `Endpoint ${method} ${path} is not defined.` },
  };
}

export function generateCurlCommand(
  method: string,
  url: string,
  token: string,
  headers: Record<string, string> = {},
  payload?: any
): string {
  let curl = `curl -X ${method} "${url}" \\\n  -H "Authorization: Bearer ${token}" \\\n  -H "Content-Type: application/json"`;
  Object.keys(headers).forEach((h) => {
    curl += ` \\\n  -H "${h}: ${headers[h]}"`;
  });
  if (payload && (method === 'POST' || method === 'PUT')) {
    curl += ` \\\n  -d '${JSON.stringify(payload, null, 2).replace(/'/g, "'\\''")}'`;
  }
  return curl;
}
