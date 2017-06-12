package com.upm.gbt.videollamada;

import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.binary.StringUtils;

@Controller
@RequestMapping("/")
public class ParameterController {

	   @RequestMapping(value = "token/{token}", method=RequestMethod.GET)
	    public String parametrosLlamada(@PathVariable("token")String token,Model model) {
		     String stoken= StringUtils.newStringUtf8(Base64.decodeBase64(token));

		     try {
			    JSONObject jsonObj = new JSONObject(stoken);
			    model.addAttribute("to",jsonObj.get("to"));
	            model.addAttribute("from",jsonObj.get("from"));
	            model.addAttribute("role",jsonObj.get("rol"));
	         
	            return "video_llamada";
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return "error";
			}
	           
	        }
}
