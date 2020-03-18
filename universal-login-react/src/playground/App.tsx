import React, {useState} from 'react';
import {BrowserRouter, Route, Switch, Link} from 'react-router-dom';
import {NavigationColumn} from '../ui/commons/NavigationColumn';
import {WalletSelector} from '../ui/WalletSelector/WalletSelector';
import {EmojiForm} from '../ui/Notifications/EmojiForm';
import {generateCode, TEST_CONTRACT_ADDRESS, TEST_PRIVATE_KEY, TEST_ACCOUNT_ADDRESS, TEST_MESSAGE_HASH, TEST_TRANSACTION_HASH} from '@unilogin/commons';
import {EmojiPanel} from '../ui/WalletSelector/EmojiPanel';
import {Settings} from '../ui/Settings/Settings';
import {Onboarding} from '../ui/Onboarding/Onboarding';
import {LogoButton} from '../ui/UFlow/LogoButton';
import {CreateRandomInstance} from './CreateRandomInstance';
import '../ui/styles/playground.css';
import UniversalLoginSDK, {DeployedWallet, DeployingWallet} from '@unilogin/sdk';
import {Spinner} from '../ui/commons/Spinner';
import {useAsync} from '../ui/hooks/useAsync';
import {WalletService} from '@unilogin/sdk';
import {mockNotifications, CONNECTION_REAL_ADDRESS} from '../ui/PlaygroundUtils/mockNotifications';
import {ModalWrapper} from '../ui/Modals/ModalWrapper';
import {WaitingForOnRampProvider} from '../ui/TopUp/Fiat/WaitingForOnRampProvider';
import {TopUp} from '../ui/TopUp/TopUp';
import {WaitingForTransaction} from '../ui/commons/WaitingForTransaction';
import {ThemesPlayground} from './ThemesPlayground';
import {ThemeProvider} from '../ui/themes/Theme';
import {ErrorMessage} from '../ui/commons/ErrorMessage';
import {AppPreloader} from '../ui/commons/AppPreloader';
import {TopUpProvider} from '../core/models/TopUpProvider';
import config from './config';

export const App = () => {
  const [sdk] = useState(() => {
    const sdk = new UniversalLoginSDK(config.relayerUrl, config.jsonRpcUrl, {
      applicationInfo: {type: 'laptop'},
      observedTokensAddresses: config.tokens,
      saiTokenAddress: config.saiTokenAddress,
      network: 'ganache',
    });
    sdk.featureFlagsService.enableAll(new URLSearchParams(window.location.search).getAll('feature'));
    sdk.start();
    return sdk;
  });
  const [relayerConfig] = useAsync(() => sdk.fetchRelayerConfig(), []);
  const [walletService] = useState(() => new WalletService(sdk));

  const name = 'test.mylogin.eth';

  const deployingWallet = new DeployingWallet({
    contractAddress: TEST_ACCOUNT_ADDRESS,
    name,
    privateKey: TEST_PRIVATE_KEY,
    deploymentHash: TEST_MESSAGE_HASH,
  }, sdk);

  const futureWallet = {
    contractAddress: TEST_ACCOUNT_ADDRESS,
    privateKey: TEST_PRIVATE_KEY,
    deploy: async () => deployingWallet,
    waitForBalance: (async () => {}) as any,
    setSupportedToken: (() => {}) as any,
  } as any;

  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="playground">
          <NavigationColumn />
          <div className="playground-content">
            <Switch>
              <Route exact path="/" render={() => (<p>Welcome to Universal Login</p>)} />
              <Route exact path="/themes" render={() => <ThemesPlayground />} />
              <Route exact path="/logoButton">
                <div>
                  <button onClick={() => mockNotifications(sdk)}>Create mock notifications</button>
                  <hr />
                  <CreateRandomInstance walletService={walletService} />
                  <hr />
                  <LogoButton walletService={walletService} />
                </div>
              </Route>
              <Route
                exact
                path="/onboarding/success"
                render={({history}) => <>
                  <div> Success!!! </div>
                  <br />
                  <button onClick={() => {
                    walletService.disconnect();
                    history.push('/onboarding');
                  }}>Disconnect</button>
                </>}
              />
              <Route
                exact
                path="/onboarding"
                render={({history}) =>
                  <Onboarding
                    walletService={walletService}
                    domains={['mylogin.eth', 'universal-id.eth', 'poppularapp.eth']}
                    onConnect={() => console.log('connected')}
                    onCreate={() => history.push('/onboarding/success')}
                    hideModal={() => history.push('/')}
                  />}
              />
              <Route exact path="/walletSelector">
                <WalletSelector
                  onCreateClick={() => {console.log('create');}}
                  onConnectClick={() => {console.log('connect');}}
                  sdk={sdk}
                  domains={['mylogin.eth', 'myapp.eth']}
                />
              </Route>
              <Route
                exact
                path="/keyboard"
                render={() => {
                  return relayerConfig ? (
                    <div>
                      <EmojiPanel code={generateCode(CONNECTION_REAL_ADDRESS)} />
                      <hr />
                      <EmojiForm
                        notifications={[]}
                        onDenyClick={() => {}}
                        setPublicKey={() => {}}
                      />
                    </div>
                  ) : <Spinner />;
                }}
              />
              <Route
                exact
                path="/topUp"
                render={() =>
                  <div>
                    <Link to="/topUpRegular">Regular</Link><br />
                    <Link to="/topUpDeployment">Deployment</Link>
                  </div>}
              />
              <Route
                exact
                path="/topUpRegular"
                render={() => {
                  const topUpWalletService = new WalletService(sdk);
                  const topUpDeployedWallet = new DeployedWallet(TEST_CONTRACT_ADDRESS, 'bob.mylogin.eth', TEST_PRIVATE_KEY, sdk);
                  topUpWalletService.setWallet(topUpDeployedWallet.asApplicationWallet);
                  if (!relayerConfig) {
                    return <Spinner />;
                  }
                  return <TopUp
                    walletService={topUpWalletService}
                    hideModal={() => history.back()}
                    isModal
                  />;
                }}
              />
              <Route
                exact
                path="/topUpDeployment"
                render={() => {
                  const topUpWalletService = new WalletService(sdk);
                  topUpWalletService.setFutureWallet(futureWallet, name);
                  if (!relayerConfig) {
                    return <Spinner />;
                  }
                  return <TopUp
                    walletService={topUpWalletService}
                    hideModal={() => history.back()}
                    isModal
                  />;
                }}
              />
              <Route exact path="/settings" render={() => <Settings deployedWallet={new DeployedWallet(TEST_CONTRACT_ADDRESS, 'bob.mylogin.eth', TEST_PRIVATE_KEY, sdk)} />} />
              <Route exact path="/recover" render={() => (<div><p>Recover</p></div>)} />
              <Route exact path="/waiting">
                <WaitingForOnRampProvider onRampProviderName={TopUpProvider.RAMP} />
              </Route>
              <Route exact path="/waitForTransaction">
                <div>
                  <ThemesPlayground />
                  <Link to="/waitForTransactionWithHash">With hash</Link><br />
                  <Link to="/waitForTransactionWithoutHash">Without hash</Link>
                </div>
              </Route>
              <Route
                path="/waitForTransactionWithHash"
                render={({history}) => {
                  if (!relayerConfig) {
                    return <Spinner />;
                  } else {
                    return (
                      <ModalWrapper hideModal={() => history.push('/waitForTransaction')} message="This is a test environment running on Ropsten network">
                        <WaitingForTransaction
                          action="Waiting for transfer"
                          relayerConfig={relayerConfig}
                          transactionHash={TEST_TRANSACTION_HASH}
                        />
                      </ModalWrapper>
                    );
                  }
                }}>
              </Route>
              <Route
                path="/waitForTransactionWithoutHash"
                render={({history}) => {
                  if (!relayerConfig) {
                    return <Spinner />;
                  } else {
                    return (
                      <ModalWrapper hideModal={() => history.push('/waitForTransaction')} message="This is a test environment running on Ropsten network">
                        <WaitingForTransaction
                          action="Waiting for transfer"
                          relayerConfig={relayerConfig}
                          transactionHash={undefined}
                        />
                      </ModalWrapper>
                    );
                  }
                }}>
              </Route>
              <Route
                path="/waitForApp"
                render={({history}) => (
                  <ModalWrapper hideModal={() => history.push('/')}>
                    <AppPreloader />
                  </ModalWrapper>
                )}>
              </Route>
              <Route
                exact path="/errorMessage"
                render={() => <ErrorMessage />}
              />
              <Route component={() => (<p>not found</p>)} />
            </Switch>
          </div>
        </div>
      </ThemeProvider>
    </BrowserRouter >
  );
};

export default App;