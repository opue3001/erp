import React, { useState } from 'react';
import { 
  Globe2, 
  Send, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  Code2, 
  Server,
  Play
} from 'lucide-react';
import { STANDARD_ENDPOINTS, executeRestApi, generateCurlCommand } from '../../framework/apiEngine';
import { RestEndpoint, ApiResponse } from '../../types/erp';
import { frappeAuth } from '../../framework/auth';

export const RestApiExplorer: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<RestEndpoint>(STANDARD_ENDPOINTS[0]);
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>(STANDARD_ENDPOINTS[0].method);
  const [path, setPath] = useState<string>(STANDARD_ENDPOINTS[0].path);
  const [paramsText, setParamsText] = useState<string>(
    JSON.stringify(STANDARD_ENDPOINTS[0].defaultParams || {}, null, 2)
  );
  const [payloadText, setPayloadText] = useState<string>(
    JSON.stringify(STANDARD_ENDPOINTS[0].defaultPayload || {}, null, 2)
  );

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const currentUser = frappeAuth.getCurrentUser();
  const token = frappeAuth.getAuthToken();

  const handleSelectEndpoint = (ep: RestEndpoint) => {
    setSelectedEndpoint(ep);
    setMethod(ep.method);
    setPath(ep.path);
    setParamsText(JSON.stringify(ep.defaultParams || {}, null, 2));
    setPayloadText(JSON.stringify(ep.defaultPayload || {}, null, 2));
    setResponse(null);
  };

  const handleSend = async () => {
    setLoading(true);
    let params: Record<string, string> | undefined = undefined;
    let payload: any = undefined;

    try {
      if (paramsText.trim()) params = JSON.parse(paramsText);
    } catch (e) {
      console.warn('Invalid params JSON');
    }

    try {
      if (payloadText.trim() && (method === 'POST' || method === 'PUT')) {
        payload = JSON.parse(payloadText);
      }
    } catch (e) {
      console.warn('Invalid payload JSON');
    }

    try {
      const res = await executeRestApi(method, path, params, payload);
      setResponse(res);
    } catch (err: any) {
      setResponse({
        status: 500,
        statusText: 'Internal Error',
        elapsedMs: 12,
        timestamp: new Date().toISOString(),
        data: { error: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  let parsedPayload: any = undefined;
  try {
    if (payloadText.trim()) parsedPayload = JSON.parse(payloadText);
  } catch {}

  const curlCommand = generateCurlCommand(
    method,
    `https://api.aether-erp.internal${path}`,
    token,
    {},
    parsedPayload
  );

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Framework Engine</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">REST API Interface</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            REST API Explorer & Workbench
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Interactive API client for querying resources, invoking whitelisted methods, and testing token authorization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Auth: <strong>{currentUser.role}</strong></span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Endpoints Sidebar & Request/Response Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Endpoints catalog (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Standard Endpoints
            </h3>
            <div className="space-y-1.5">
              {STANDARD_ENDPOINTS.map((ep) => {
                const isSelected = selectedEndpoint.id === ep.id;
                return (
                  <button
                    key={ep.id}
                    onClick={() => handleSelectEndpoint(ep)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {ep.title}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          ep.method === 'GET'
                            ? 'bg-sky-100 text-sky-800'
                            : ep.method === 'POST'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ep.method === 'PUT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ep.method}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      {ep.path}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* cURL Command Generator */}
          <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xs space-y-2 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                cURL Snippet
              </span>
              <button
                onClick={copyCurl}
                className="text-xs text-slate-300 hover:text-white flex items-center gap-1"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-950 rounded border border-slate-800 leading-relaxed whitespace-pre-wrap">
              {curlCommand}
            </pre>
          </div>
        </div>

        {/* Workbench: Request & Response (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Request Header Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="px-3 py-2 text-xs font-bold font-mono bg-slate-100 border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>

              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/v1/resource/Customer"
                className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 text-slate-800"
              />

              <button
                onClick={handleSend}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin text-sm">⟳</span>
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Send</span>
              </button>
            </div>

            {/* Request Body & Query Params */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Query Parameters (JSON)
                </label>
                <textarea
                  rows={5}
                  value={paramsText}
                  onChange={(e) => setParamsText(e.target.value)}
                  className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                />
              </div>

              {(method === 'POST' || method === 'PUT') && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Request Payload Body (JSON)
                  </label>
                  <textarea
                    rows={5}
                    value={payloadText}
                    onChange={(e) => setPayloadText(e.target.value)}
                    className="w-full p-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Response Container */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-md">
            {/* Header info */}
            <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-300">Live Response</span>
                {response && (
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      response.status < 300
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : response.status === 403
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {response.status} {response.statusText}
                  </span>
                )}
              </div>

              {response && (
                <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono tabular-nums">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{response.elapsedMs} ms</span>
                  </div>
                  <span>·</span>
                  <span>{response.timestamp.substring(11, 19)} UTC</span>
                </div>
              )}
            </div>

            {/* Output view */}
            <div className="p-5 max-h-[460px] overflow-auto">
              {response ? (
                <pre className="text-xs font-mono text-slate-200 leading-relaxed">
                  <code>{JSON.stringify(response.data, null, 2)}</code>
                </pre>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Click <strong>Send</strong> above to execute the request against the REST API engine.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
