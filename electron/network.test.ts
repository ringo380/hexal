import { describe, it, expect } from 'vitest';
import type { NetworkInterfaceInfo } from 'os';
import { pickLanAddress } from './network';

function v4(address: string, internal = false): NetworkInterfaceInfo {
  return { address, family: 'IPv4', internal, netmask: '255.255.255.0', mac: '00:00:00:00:00:00', cidr: null };
}

describe('pickLanAddress', () => {
  it('prefers the default-route address over earlier adapters', () => {
    const interfaces = {
      'sf-relay': [v4('10.77.0.2')],
      Ethernet: [v4('10.0.0.254')],
    };
    expect(pickLanAddress(interfaces, '10.0.0.254')).toBe('10.0.0.254');
  });

  it('ignores a default route owned by a full-tunnel VPN', () => {
    const interfaces = {
      wg0: [v4('10.8.0.2')],
      Tailscale: [v4('100.64.0.3')],
      'Wi-Fi': [v4('192.168.1.42')],
    };
    expect(pickLanAddress(interfaces, '10.8.0.2')).toBe('192.168.1.42');
    expect(pickLanAddress(interfaces, '100.64.0.3')).toBe('192.168.1.42');
  });

  it('ranks Linux and macOS VM and container bridges below the real NIC', () => {
    const interfaces = {
      virbr0: [v4('192.168.122.1')],
      'br-3f2a9c': [v4('172.18.0.1')],
      bridge100: [v4('192.168.64.1')],
      eth0: [v4('10.0.0.5')],
    };
    expect(pickLanAddress(interfaces)).toBe('10.0.0.5');
  });

  it('ignores a default-route address no adapter owns', () => {
    const interfaces = { Ethernet: [v4('192.168.1.20')] };
    expect(pickLanAddress(interfaces, '203.0.113.5')).toBe('192.168.1.20');
  });

  it('ranks real adapters above WSL, Docker and VPN adapters', () => {
    const interfaces = {
      'vEthernet (WSL (Hyper-V firewall))': [v4('172.20.16.1')],
      Tailscale: [v4('100.64.0.3')],
      'Wi-Fi': [v4('192.168.1.42')],
    };
    expect(pickLanAddress(interfaces)).toBe('192.168.1.42');
  });

  it('skips internal, IPv6 and link-local addresses', () => {
    const interfaces = {
      Loopback: [v4('127.0.0.1', true)],
      Npcap: [v4('169.254.57.216')],
      Ethernet: [{ ...v4('fe80::1'), family: 'IPv6' as const, scopeid: 0 }, v4('10.0.0.254')],
    };
    expect(pickLanAddress(interfaces)).toBe('10.0.0.254');
  });

  it('returns null when nothing is reachable', () => {
    expect(pickLanAddress({ Loopback: [v4('127.0.0.1', true)] })).toBeNull();
  });
});
