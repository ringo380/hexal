import * as dgram from 'dgram';
import type { NetworkInterfaceInfo } from 'os';

// Adapter names that are almost never the address other people on the LAN can reach.
// Covers Windows (vEthernet, Npcap), Linux (virbr, docker0, br-<id>, veth, wg) and
// macOS (bridge100, utun) virtual adapters plus common VPN clients.
const VIRTUAL_ADAPTER = /vethernet|wsl|hyper-v|docker|virtualbox|vmware|vbox|npcap|loopback|tailscale|zerotier|wireguard|utun|tun\d|tap\d|virbr|^br-|^bridge\d|^veth|^wg\d/i;

function privateRank(address: string): number {
  if (address.startsWith('192.168.')) return 0;
  if (address.startsWith('10.')) return 1;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(address)) return 2;
  return 3;
}

/**
 * Choose the IPv4 address to show players as the join URL.
 *
 * Machines with WSL, Docker, VPNs or game relays expose several adapters, and
 * the first non-internal one is often a virtual adapter players cannot reach.
 * The address the OS uses for its default route wins when it is known and
 * belongs to a real adapter (a full-tunnel VPN owns the default route, but LAN
 * players cannot reach its address); otherwise real adapters beat virtual
 * ones, and home-LAN ranges beat the rest.
 */
export function pickLanAddress(
  interfaces: NodeJS.Dict<NetworkInterfaceInfo[]>,
  defaultRouteAddress?: string | null,
): string | null {
  const candidates: { name: string; address: string }[] = [];
  Object.keys(interfaces).forEach(name => {
    (interfaces[name] || []).forEach(addr => {
      if (addr.family === 'IPv4' && !addr.internal && !addr.address.startsWith('169.254.')) {
        candidates.push({ name, address: addr.address });
      }
    });
  });

  const routeOwner = candidates.filter(c => c.address === defaultRouteAddress)[0];
  if (routeOwner && !VIRTUAL_ADAPTER.test(routeOwner.name)) {
    return routeOwner.address;
  }

  candidates.sort((a, b) => {
    const virtualDiff = Number(VIRTUAL_ADAPTER.test(a.name)) - Number(VIRTUAL_ADAPTER.test(b.name));
    return virtualDiff || privateRank(a.address) - privateRank(b.address);
  });
  return candidates.length > 0 ? candidates[0].address : null;
}

/**
 * Ask the OS which local address it would route public traffic from.
 * Connecting a UDP socket sends no packets; it only performs the route lookup.
 * Resolves null when there is no route (offline, or no default gateway) or
 * the lookup takes longer than a second.
 */
export function detectDefaultRouteAddress(): Promise<string | null> {
  return new Promise(resolve => {
    const socket = dgram.createSocket('udp4');
    let done = false;
    const finish = (address: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { socket.close(); } catch { /* already closed */ }
      resolve(address);
    };
    const timer = setTimeout(() => finish(null), 1000);
    socket.on('error', () => finish(null));
    socket.connect(53, '8.8.8.8', () => {
      try {
        finish(socket.address().address);
      } catch {
        finish(null);
      }
    });
  });
}
