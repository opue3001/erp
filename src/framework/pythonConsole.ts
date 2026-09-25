import { frappeDB } from './db';
import { frappeAuth } from './auth';

export interface ConsoleRecipe {
  id: string;
  title: string;
  language: 'python' | 'javascript';
  description: string;
  code: string;
}

export const PRESET_RECIPES: ConsoleRecipe[] = [
  {
    id: 'py_fetch_customers',
    title: 'Query Active Customers with Filter',
    language: 'python',
    description: 'Uses frappe.db.get_list() with filtering and field projection.',
    code: `# Fetch active enterprise customers
customers = frappe.db.get_list(
    "Customer",
    filters={"status": "Active"},
    fields=["name", "customer_name", "credit_limit", "territory"],
    order_by="credit_limit desc"
)

print(f"Found {len(customers)} active customer accounts:")
for c in customers:
    print(f" -> [{c['name']}] {c['customer_name']} | Credit: \${c['credit_limit']} ({c['territory']})")
`,
  },
  {
    id: 'py_calc_inventory',
    title: 'Calculate Total Warehouse Valuation',
    language: 'python',
    description: 'Iterates through inventory items and computes valuation aggregates.',
    code: `# Compute total inventory stock on hand and valuation
items = frappe.db.get_list("Item", fields=["item_code", "item_name", "total_qty", "valuation_rate", "status"])

total_asset_value = 0.0
total_units = 0

print("=== INVENTORY VALUATION REPORT ===")
for item in items:
    units = item.get("total_qty", 0)
    rate = item.get("valuation_rate", 0)
    value = units * rate
    total_asset_value += value
    total_units += units
    print(f"{item['item_code']} | Qty: {units} @ \${rate} = \${value} [{item['status']}]")

print("-" * 55)
print(f"TOTAL INVENTORY UNITS : {total_units} units")
print(f"TOTAL WAREHOUSE VALUE : \${total_asset_value}")
`,
  },
  {
    id: 'py_create_so',
    title: 'Create & Submit New Sales Order',
    language: 'python',
    description: 'Demonstrates ORM document lifecycle: new_doc -> fields -> save -> submit.',
    code: `# Create a new sales contract
doc = frappe.new_doc("Sales Order")
doc.customer = "Helios Semiconductor Corp"
doc.transaction_date = "2026-03-25"
doc.delivery_date = "2026-04-15"
doc.currency = "USD"
doc.items_summary = "10x Industrial Micro-Servo Actuator 24V"
doc.net_total = 3400.00

# Save and submit document
doc.insert()
doc.submit()

print(f"Successfully generated and submitted Sales Order: {doc.name}")
print(f"Status: {doc.workflow_state} | Grand Total: \${doc.grand_total} (Includes 8% tax: \${doc.tax_amount})")
`,
  },
  {
    id: 'js_update_price',
    title: 'JS ORM: Batch Adjust Item Standard Rates',
    language: 'javascript',
    description: 'JavaScript API to fetch and update document fields via frappeDB.',
    code: `// Retrieve items and apply standard 5% index adjustment
const items = frappeDB.get_list('Item');
console.log('Adjusting standard selling rates by +5%...');

items.forEach(item => {
  const oldRate = item.standard_rate || 0;
  const newRate = Math.round(oldRate * 1.05 * 100) / 100;
  frappeDB.set_value('Item', item.name, 'standard_rate', newRate);
  console.log(item.item_code + ': $' + oldRate + ' -> $' + newRate);
});

console.log('Update complete. Current items: ' + items.length);
`,
  },
];

export function executeConsoleCode(code: string, language: 'python' | 'javascript'): { output: string; error?: string } {
  const logs: string[] = [];
  const log = (...args: any[]) => {
    logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
  };

  try {
    if (language === 'javascript') {
      // Create isolated sandbox with frappeDB and frappeAuth
      const sandbox = {
        frappeDB,
        frappeAuth,
        console: { log, warn: log, error: log },
      };

      const fn = new Function('frappeDB', 'frappeAuth', 'console', code);
      fn(sandbox.frappeDB, sandbox.frappeAuth, sandbox.console);

      return { output: logs.join('\n') || 'Script executed with no console output.' };
    }

    // Python-like ORM simulation interpreter
    // Parse common Frappe Python idioms:
    // frappe.db.get_list, frappe.get_doc, frappe.new_doc, doc.insert, doc.submit, print
    const pySandbox: any = {
      frappe: {
        db: {
          get_list: (dt: string, opts?: any) => frappeDB.get_list(dt, opts),
          get_value: (dt: string, filters: any, fieldname: string) => frappeDB.get_value(dt, filters, fieldname),
          set_value: (dt: string, name: string, fieldname: string, val: any) => frappeDB.set_value(dt, name, fieldname, val),
        },
        get_doc: (dt: string, name: string) => {
          const doc = frappeDB.get_doc(dt, name);
          if (!doc) throw new Error(`Document ${dt} ${name} not found`);
          return wrapDoc(doc);
        },
        new_doc: (dt: string) => {
          const raw: any = { doctype: dt };
          return wrapDoc(raw, true);
        },
        throw: (msg: string) => {
          throw new Error(msg);
        },
        msgprint: (msg: string) => {
          log(`[Frappe Message]: ${msg}`);
        },
      },
      print: log,
    };

    function wrapDoc(raw: any, isNew = false) {
      return new Proxy(raw, {
        get(target, prop: string) {
          if (prop === 'insert') {
            return () => {
              const res = frappeDB.insert(target, frappeAuth.getCurrentUser().full_name);
              Object.assign(target, res);
              return target;
            };
          }
          if (prop === 'save') {
            return () => {
              const res = frappeDB.save(target, frappeAuth.getCurrentUser().full_name);
              Object.assign(target, res);
              return target;
            };
          }
          if (prop === 'submit') {
            return () => {
              if (isNew && !target.name) target.insert();
              const res = frappeDB.submit(target.doctype, target.name);
              Object.assign(target, res);
              return target;
            };
          }
          if (prop === 'cancel') {
            return () => {
              const res = frappeDB.cancel(target.doctype, target.name);
              Object.assign(target, res);
              return target;
            };
          }
          return target[prop];
        },
        set(target, prop: string, value) {
          target[prop] = value;
          return true;
        },
      });
    }

    // Convert simplified Python script into executable JS
    let jsTranspiled = code
      // comments
      .replace(/#.*$/gm, (m) => `// ${m.substring(1)}`)
      // True/False/None
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      // print(...)
      .replace(/\bprint\s*\(/g, 'print(')
      // len(x)
      .replace(/\blen\(([^)]+)\)/g, '($1.length)')
      // for x in y:
      .replace(/for\s+([a-zA-Z0-9_]+)\s+in\s+([a-zA-Z0-9_().]+)\s*:/g, 'for (const $1 of $2) {')
      // f"..." string templates
      .replace(/f"([^"]*)"/g, (match, p1) => {
        // replace {expr} with ${expr}
        // handle formatting like {val:,} or {val:>4}
        const replaced = p1.replace(/\{([^}]+)\}/g, (_: string, expr: string) => {
          const cleanExpr = expr.split(':')[0].trim();
          return `\${${cleanExpr}}`;
        });
        return `\`${replaced}\``;
      })
      .replace(/f'([^']*)'/g, (match, p1) => {
        const replaced = p1.replace(/\{([^}]+)\}/g, (_: string, expr: string) => {
          const cleanExpr = expr.split(':')[0].trim();
          return `\${${cleanExpr}}`;
        });
        return `\`${replaced}\``;
      });

    // Auto-close open for blocks if indented
    const lines = jsTranspiled.split('\n');
    let inBlock = false;
    const finalLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('for (const ') && line.endsWith('{')) {
        inBlock = true;
        finalLines.push(line);
      } else if (inBlock && (line.trim() === '' || line.startsWith('print') || line.match(/^[a-zA-Z]/))) {
        if (!line.startsWith('    ') && !line.startsWith('\t') && line.trim() !== '') {
          finalLines.push('}');
          inBlock = false;
        }
        finalLines.push(line);
      } else {
        finalLines.push(line);
      }
    }
    if (inBlock) finalLines.push('}');

    const runner = new Function('frappe', 'print', finalLines.join('\n'));
    runner(pySandbox.frappe, pySandbox.print);

    return { output: logs.join('\n') || 'Python script executed successfully with no output.' };
  } catch (err: any) {
    return {
      output: logs.join('\n'),
      error: `Traceback (most recent call last):\n  File "<console>", line 1\n${err.name}: ${err.message}`,
    };
  }
}
