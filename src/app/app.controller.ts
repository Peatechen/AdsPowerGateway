import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('api/v1/browser')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get('local_active')
  async getLocalActive(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await this.appService.getLocalActive();
      const responseData = JSON.parse(response.data);

      if (responseData.data?.list) {
        (responseData.data.list as Array<any>).forEach((item) => {
          const puppeteerUrl = new URL(item.ws.puppeteer);

          puppeteerUrl.port = this.configService.get('PORT');

          item.ws.puppeteer = puppeteerUrl.href;
          item.ws.selenium = puppeteerUrl.host;
          item.debug_port = puppeteerUrl.port;
        });
      }

      res.status(response.status).send(responseData);
    } catch (error) {
      res
        .status(error.response?.status || 500)
        .send(error.response?.data || 'Internal Server Error');
    }
  }

  @Get('active')
  async getActive(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await this.appService.getActive(req.query);
      const responseData = JSON.parse(response.data);

      console.log(responseData);

      if (responseData.data?.ws) {
        const puppeteerUrl = new URL(responseData.data.ws.puppeteer);

        puppeteerUrl.port = this.configService.get('PORT');

        responseData.data.ws.puppeteer = puppeteerUrl.href;
        responseData.data.ws.selenium = puppeteerUrl.host;
        responseData.data.debug_port = puppeteerUrl.port;
      }

      res.status(response.status).send(responseData);
    } catch (error) {
      console.log(error);
      res
        .status(error.response?.status || 500)
        .send(error.response?.data || 'Internal Server Error');
    }
  }

  @Get('start')
  async startBrowser(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await this.appService.startBrowser(req.query);
      const responseData = JSON.parse(response.data);

      if (responseData.data?.ws?.puppeteer) {
        const puppeteerUrl = new URL(responseData.data.ws.puppeteer);

        puppeteerUrl.port = this.configService.get('PORT');

        responseData.data.ws.puppeteer = puppeteerUrl.href;
        responseData.data.ws.selenium = puppeteerUrl.host;
        responseData.data.debug_port = puppeteerUrl.port;
      }

      res.status(response.status).send(responseData);
    } catch (error) {
      res
        .status(error.response?.status || 500)
        .send(error.response?.data || 'Internal Server Error');
    }
  }

  @Get('stop')
  async stopBrowser(@Req() req: Request, @Res() res: Response) {
    try {
      const response = await this.appService.stopBrowser(req.query);
      res.status(response.status).send(response.data);
    } catch (error) {
      res
        .status(error.response?.status || 500)
        .send(error.response?.data || 'Internal Server Error');
    }
  }
}
