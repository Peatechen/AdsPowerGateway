import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Axios } from 'axios';

@Injectable()
export class AppService {
  private readonly axios: Axios;

  constructor(private readonly configServer: ConfigService) {
    this.axios = new Axios({
      baseURL: new URL(
        `http://${this.configServer.get(
          'ADS_POWER_SERVER_HOST',
        )}:${this.configServer.get('ADS_POWER_SERVER_PORT')}`,
      ).origin,
    });
  }

  async getLocalActive() {
    return await this.axios.get('/api/v1/browser/local-active');
  }

  async startBrowser(startParams: Record<string, any>) {
    return await this.axios.get('/api/v1/browser/start', {
      params: startParams,
    });
  }

  async stopBrowser(startParams: Record<string, any>) {
    return await this.axios.get('/api/v1/browser/stop', {
      params: startParams,
    });
  }

  async searchBrowserEndpointPort(reqUrl: string): Promise<string> {
    try {
      const pathname = new URL(reqUrl, 'ws://127.0.0.1').pathname;

      const localActiveResponse = await this.axios.get(
        '/api/v1/browser/local-active',
      );
      const responseData = JSON.parse(localActiveResponse.data);

      if (responseData.data?.list) {
        const target = (responseData.data.list as Array<any>).find((item) => {
          const puppeteerUrl = new URL(item.ws.puppeteer);

          return puppeteerUrl.pathname === pathname;
        });

        if (target) {
          return new URL(target.ws.puppeteer).port;
        }
      }
    } catch (err) {
      throw err;
    }
  }
}
