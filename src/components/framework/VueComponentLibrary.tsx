import React, { useState } from 'react';
import { 
  Palette, 
  Code2, 
  Copy, 
  Check, 
  Sliders, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface ComponentSpec {
  name: string;
  category: 'Actions' | 'Form Controls' | 'Data Display' | 'Overlays';
  description: string;
  vueTemplate: string;
  vueScript: string;
  pythonIntegration: string;
}

const VUE_COMPONENTS: ComponentSpec[] = [
  {
    name: 'FeatherButton',
    category: 'Actions',
    description: 'High-intent action control with loading spinner, icon slots, and variant tokens.',
    vueTemplate: `<template>
  <button 
    :class="[
      'inline-flex items-center justify-center font-medium transition-colors rounded-lg',
      sizeClasses[size],
      variantClasses[variant],
      loading || disabled ? 'opacity-60 cursor-not-allowed' : ''
    ]"
    :disabled="loading || disabled"
    @click="$emit('click')"
  >
    <Spinner v-if="loading" class="w-4 h-4 mr-2 animate-spin" />
    <slot name="prefix" v-else-if="$slots.prefix" />
    <slot />
  </button>
</template>`,
    vueScript: `<script setup lang="ts">
interface Props {
  variant?: 'solid' | 'subtle' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'solid',
  size: 'md',
  loading: false,
  disabled: false
});

const variantClasses = {
  solid: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
  subtle: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'border border-slate-200 text-slate-800 hover:bg-slate-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700'
};

const sizeClasses = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-2 text-xs',
  lg: 'px-5 py-2.5 text-sm'
};
</script>`,
    pythonIntegration: `# Connected via Frappe REST call
@frappe.whitelist()
def trigger_action(docname):
    doc = frappe.get_doc("Sales Order", docname)
    doc.submit()
    return {"status": "success", "message": "Order processed"}`,
  },
  {
    name: 'LinkField (Autocomplete)',
    category: 'Form Controls',
    description: 'Relational Link search control connecting DocTypes across the database abstraction layer.',
    vueTemplate: `<template>
  <div class="relative">
    <label v-if="label" class="text-xs font-semibold text-slate-700 mb-1 block">
      {{ label }} <span v-if="required" class="text-rose-500">*</span>
    </label>
    <div class="relative">
      <input
        type="text"
        v-model="query"
        @focus="open = true"
        :placeholder="placeholder || 'Search ' + doctype + '...'"
        class="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
      />
      <div v-if="open && suggestions.length" class="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1">
        <div 
          v-for="item in suggestions" 
          :key="item.name"
          @click="selectItem(item)"
          class="px-3 py-2 text-xs hover:bg-slate-50 cursor-pointer flex justify-between"
        >
          <span class="font-medium text-slate-900">{{ item.name }}</span>
          <span class="text-slate-400">{{ item.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>`,
    vueScript: `<script setup lang="ts">
import { ref, watch } from 'vue';
import { frappeRequest } from '../api';

const props = defineProps<{
  doctype: string;
  modelValue: string;
  label?: string;
  required?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);
const query = ref(props.modelValue);
const suggestions = ref([]);
const open = ref(false);

watch(query, async (val) => {
  if (val.length >= 2) {
    const res = await frappeRequest({
      method: 'GET',
      path: \`/api/v1/resource/\${props.doctype}?filters={"name": "\${val}"}\`
    });
    suggestions.value = res.data;
  }
});

function selectItem(item: any) {
  emit('update:modelValue', item.name);
  query.value = item.name;
  open.value = false;
}
</script>`,
    pythonIntegration: `# Server search hook
@frappe.whitelist()
def search_link(doctype, txt):
    return frappe.db.get_list(doctype, filters={"name": ["like", f"%{txt}%"]}, limit=10)`,
  },
  {
    name: 'DataGrid',
    category: 'Data Display',
    description: 'High-density virtualized data table with column sorting, selection, and pagination.',
    vueTemplate: `<template>
  <div class="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
    <table class="w-full text-left text-xs border-collapse">
      <thead class="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
        <tr>
          <th v-for="col in columns" :key="col.key" class="py-2.5 px-4" :class="col.align === 'right' ? 'text-right' : 'text-left'">
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        <tr v-for="row in rows" :key="row.id" class="hover:bg-slate-50/80 transition-colors">
          <td v-for="col in columns" :key="col.key" class="py-3 px-4 font-mono tabular-nums">
            {{ row[col.key] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>`,
    vueScript: `<script setup lang="ts">
defineProps<{
  columns: { key: string; label: string; align?: 'left' | 'right' }[];
  rows: Record<string, any>[];
}>();
</script>`,
    pythonIntegration: `# Data provider query
@frappe.whitelist()
def get_grid_records(doctype, page=1, page_len=20):
    return frappe.db.get_list(doctype, limit_page_length=page_len, limit_start=(page-1)*page_len)`,
  },
];

export const VueComponentLibrary: React.FC = () => {
  const [selectedComp, setSelectedComp] = useState<ComponentSpec>(VUE_COMPONENTS[0]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Interactive playground props for FeatherButton
  const [btnVariant, setBtnVariant] = useState<'solid' | 'subtle' | 'outline' | 'danger'>('solid');
  const [btnSize, setBtnSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);

  const fullVueSfcCode = `${selectedComp.vueTemplate}\n\n${selectedComp.vueScript}\n\n<style scoped>\n/* Tailwind utility primitives applied directly */\n</style>`;

  const copyCode = () => {
    navigator.clipboard.writeText(fullVueSfcCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Framework Engine</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">UI Component Library</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Vue-Based UI Component Architecture
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Modern, enterprise-grade Vue 3 component library built for responsive ERP workspace applications.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-lg">
          <span>Vue 3 + TypeScript</span>
        </div>
      </div>

      {/* Main Grid: Component Selector, Live Render, SFC Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Component Selector List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              UI Library Catalog
            </h3>
            <div className="space-y-2">
              {VUE_COMPONENTS.map((comp) => {
                const isSelected = selectedComp.name === comp.name;
                return (
                  <button
                    key={comp.name}
                    onClick={() => setSelectedComp(comp)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">
                        {comp.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {comp.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {comp.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Architecture Card */}
          <div className="bg-slate-900 rounded-xl p-5 text-white border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Why Vue for ERP?
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Vue&apos;s Single File Component (SFC) paradigm and high-performance reactive reactivity engine provide seamless data-binding with the Python backend&apos;s REST resources and real-time ledger updates.
            </p>
          </div>
        </div>

        {/* Live Playground & Code (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Live Component Render Stage */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Live Interactive Stage: {selectedComp.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedComp.description}</p>
              </div>

              {selectedComp.name === 'FeatherButton' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBtnLoading(!btnLoading)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  >
                    Toggle Loading
                  </button>
                  <button
                    onClick={() => setBtnDisabled(!btnDisabled)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  >
                    Toggle Disabled
                  </button>
                </div>
              )}
            </div>

            {/* Render Canvas */}
            <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center min-h-[140px]">
              {selectedComp.name === 'FeatherButton' && (
                <div className="space-x-3">
                  <button
                    disabled={btnDisabled || btnLoading}
                    className={`inline-flex items-center justify-center font-semibold transition-colors rounded-lg ${
                      btnVariant === 'solid'
                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                        : btnVariant === 'subtle'
                        ? 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                        : btnVariant === 'outline'
                        ? 'border border-slate-300 text-slate-800 hover:bg-slate-100'
                        : 'bg-rose-600 text-white hover:bg-rose-700'
                    } ${
                      btnSize === 'sm' ? 'px-3 py-1.5 text-xs' : btnSize === 'md' ? 'px-4 py-2 text-xs' : 'px-5 py-2.5 text-sm'
                    } ${btnDisabled || btnLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {btnLoading && <span className="animate-spin mr-2">⟳</span>}
                    <span>Approve Sales Contract</span>
                  </button>
                </div>
              )}

              {selectedComp.name === 'LinkField (Autocomplete)' && (
                <div className="w-72 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Customer Link Field <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      defaultValue="Helios Semiconductor Corp"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg shadow-xs focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-2.5 text-[10px] font-mono text-slate-400">
                      Link: Customer
                    </span>
                  </div>
                </div>
              )}

              {selectedComp.name === 'DataGrid' && (
                <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden text-xs">
                  <div className="grid grid-cols-3 bg-slate-100 p-2 font-semibold text-slate-700">
                    <div>SKU Code</div>
                    <div>Item Group</div>
                    <div className="text-right">Unit Price</div>
                  </div>
                  <div className="grid grid-cols-3 p-2 border-t border-slate-100 font-mono">
                    <div className="text-slate-900 font-semibold">NX-OPTIC-400</div>
                    <div className="text-slate-600 font-sans">Components</div>
                    <div className="text-right tabular-nums text-slate-900">$680.00</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Single-File Component Code Box */}
          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-md border border-slate-800">
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 font-mono">
                {selectedComp.name}.vue (Single File Component)
              </span>
              <button
                onClick={copyCode}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Vue SFC</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 max-h-[360px] overflow-auto">
              <pre className="text-xs font-mono text-emerald-300 leading-relaxed">
                <code>{fullVueSfcCode}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
