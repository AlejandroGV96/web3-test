import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import detectEthereumProvider from '@metamask/detect-provider';
import Web3 from 'web3';
import { Contract, EventData } from 'web3-eth-contract';
import { AbiItem } from 'web3-utils';
// NOTE: the following import requires these compilerOptions in tsconfig.json:
// "esModuleInterop": true,
// "resolveJsonModule": true
import ABI from './abi.json';

@Injectable({
  providedIn: 'root',
})
export class ExplorersService {
  private web3: Web3;
  private contract: Contract;

  private explorers: string[] = [];
  private explorers$: BehaviorSubject<string[]> = new BehaviorSubject([]);

  private champions: string[] = [];
  private champions$: BehaviorSubject<string[]> = new BehaviorSubject([]);

  constructor() {}

  async init() {
    try {
      this.web3 = new Web3(
        'wss://goerli.infura.io/ws/v3/<infura user id>'
      );

      this.contract = new this.web3.eth.Contract(
        ABI as AbiItem[],
        '0xE832AA78b8CaF6A18404262665124947c4C0Bf0f'
      );

      // Get initial data
      const existingExplorers = this.contract.methods.getExplorers().call();
      const existingChampions = this.contract.methods.getChampions().call();

      const [explorers, champions] = await Promise.all([
        existingExplorers,
        existingChampions,
      ]);

      this.explorers = [...explorers];
      this.champions = [...champions];

      this.explorers$.next(this.explorers);
      this.champions$.next(this.champions);

      // Update with any new explorers/champions
      this.listenForUpdates();
      window['contractInstance'] = this.contract;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  listenForUpdates() {
    this.contract.events.ExplorerAdded().on('data', (event: EventData) => {
      console.log('Explorer added!');
      console.log(event);
      this.explorers.push(event.returnValues.explorer);
      this.explorers$.next(this.explorers);
    });

    this.contract.events.ChampionAdded().on('data', (event: EventData) => {
      console.log('Champion added!');
      this.champions.push(event.returnValues.champion);
      this.champions$.next(this.champions);
    });
  }

  getExplorers(): Observable<string[]> {
    return this.explorers$.pipe(map((explorers) => explorers.reverse()));
  }

  getChampions(): Observable<string[]> {
    return this.champions$.pipe(map((champions) => champions.reverse()));
  }

  async addExplorer(): Promise<string> {
    const provider: any = await detectEthereumProvider();

    if (!provider) {
      throw new Error('Please install MetaMask');
    }

    await provider.request({ method: 'eth_requestAccounts' });

    const transactionParameters = {
      // gasPrice: '0x09184e72a000', // customizable by user during MetaMask confirmation.
      // gas: '0x2710', // customizable by user during MetaMask confirmation.
      to: this.contract.options.address, // Required except during contract publications.
      from: provider.selectedAddress, // must match user's active address.
      //value: '0x00', // Only required to send ether to the recipient from the initiating external account.
      // Optional, but used for defining smart contract creation and interaction.
      data: this.contract.methods.addExplorer().encodeABI(),
      //chainId: '0x3', // Used to prevent transaction reuse across blockchains. Auto filled by MetaMask.
    };

    return provider.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
  }

  async addChampion(): Promise<string> {
    const provider: any = await detectEthereumProvider();

    if (!provider) {
      throw new Error('Please install MetaMask');
    }

    await provider.request({ method: 'eth_requestAccounts' });

    const transactionParameters = {
      // gasPrice: '0x09184e72a000', // customizable by user during MetaMask confirmation.
      // gas: '0x2710', // customizable by user during MetaMask confirmation.
      to: this.contract.options.address, // Required except during contract publications.
      from: provider.selectedAddress, // must match user's active address.
      //value: '0x00', // Only required to send ether to the recipient from the initiating external account.
      // Optional, but used for defining smart contract creation and interaction.
      data: this.contract.methods.addChampions().encodeABI(),
      //chainId: '0x3', // Used to prevent transaction reuse across blockchains. Auto filled by MetaMask.
    };

    return provider.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    });
  }
}
